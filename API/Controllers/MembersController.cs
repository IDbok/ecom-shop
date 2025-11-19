using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    public class MembersController(IMemberRepository memberRepository,
        IPhotoService photoService) : BaseApiController
    {
        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<Member>>> GetMembers()
        {
            return Ok(await memberRepository.GetMembersAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Member>> GetMember(string id)
        {
            var member = await memberRepository.GetMemberByIdAsync(id);

            if (member == null) return NotFound();
            return member;
        }

        [HttpGet("{id}/photos")]
        public async Task<ActionResult<IReadOnlyList<Photo>>> GetPhotosForMember(string id)
        {
            return Ok(await memberRepository.GetPhotosForMemberAsync(id));
        }

        [HttpPut]
        public async Task<ActionResult> UpdateMember(MemberUpdateDto memberUpdateDto)
        {
            var memberId = User.GetUserId();

            var member = await memberRepository.GetMemberForUpdateAsync(memberId);
            if (member == null) return NotFound();

            // Map the updated fields from DTO to the member entity
            if (memberUpdateDto.DisplayName != null)
            {
                member.DisplayName = memberUpdateDto.DisplayName;

                // Safely update AppUser DisplayName if it exists and is loaded
                if (member.AppUser != null)
                {
                    member.AppUser.DisplayName = memberUpdateDto.DisplayName;
                }
                else
                {
                    // Log warning or handle case where AppUser is not loaded
                    // This shouldn't happen if GetMemberForUpdateAsync properly includes AppUser
                    return BadRequest("Associated user data not found");
                }
            }
            if (memberUpdateDto.Description != null)
                member.Description = memberUpdateDto.Description;
            if (memberUpdateDto.City != null)
                member.City = memberUpdateDto.City;
            if (memberUpdateDto.Country != null)
                member.Country = memberUpdateDto.Country;

            memberRepository.Update(member);

            if (await memberRepository.SaveAllAsync()) return NoContent();

            return BadRequest("Failed to update member");
        }

        [HttpPost("add-photo")]
        public async Task<ActionResult<Photo>> AddPhoto([FromForm] IFormFile file)
        {
            var memberId = User.GetUserId();
            var member = await memberRepository.GetMemberForUpdateAsync(memberId);
            if (member == null) return NotFound();

            var result = await photoService.UploadPhotoAsync(file);

            if (result.Error != null) return BadRequest(result.Error.Message);

            // var photo = new Photo
            // {
            //     Url = result.SecureUrl.AbsoluteUri,
            //     PublicId = result.PublicId,
            //     ProductId = member.Id
            // };

            // if (member.ImageUrl == null)
            // {
            //     member.ImageUrl = photo.Url;
            //     member.AppUser.ImageUrl = photo.Url;
            // }

            // member.Photos.Add(photo);

            // if (await memberRepository.SaveAllAsync())
            // {
            //     return CreatedAtAction(nameof(GetMember), new { id = member.Id }, photo);
            // }

            return BadRequest("Problem adding photo");
        }

        [HttpPut("set-main-photo/{photoId}")]
        public async Task<ActionResult> SetMainPhoto(int photoId)
        {
            var memberId = User.GetUserId();
            var member = await memberRepository.GetMemberForUpdateAsync(memberId);
            if (member == null) return NotFound("Member not found");

            var photo = member.Photos.SingleOrDefault(p => p.Id == photoId);
            if (photo == null) return NotFound("Photo not found");

            if (member.ImageUrl == photo.Url)
            {
                return BadRequest("This is already your main photo");
            }

            member.ImageUrl = photo.Url;
            member.AppUser.ImageUrl = photo.Url;

            if (await memberRepository.SaveAllAsync())
            {
                return NoContent();
            }

            return BadRequest("Problem setting main photo");
        }

        [HttpDelete("delete-photo/{photoId}")]
        public async Task<ActionResult> DeletePhoto(int photoId)
        {
            var memberId = User.GetUserId();
            var member = await memberRepository.GetMemberForUpdateAsync(memberId);
            if (member == null) return NotFound("Member not found");

            var photo = member.Photos.SingleOrDefault(p => p.Id == photoId);
            if (photo == null) return NotFound("Photo not found");

            if (member.ImageUrl == photo.Url)
            {
                return BadRequest("You cannot delete your main photo");
            }

            if (photo.PublicId != null)
            {
                var result = await photoService.DeletePhotoAsync(photo.PublicId);
                if (result.Error != null) return BadRequest(result.Error.Message);
            }

            member.Photos.Remove(photo);

            if (await memberRepository.SaveAllAsync())
            {
                return Ok();
            }

            return BadRequest("Problem deleting the photo");
        }
    }


}
