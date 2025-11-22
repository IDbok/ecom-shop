using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    public class MembersController(IMemberRepository memberRepository) : BaseApiController
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

        // [HttpGet("{id}/assets")]
        // public async Task<ActionResult<IReadOnlyList<Asset>>> GetAssetsForMember(string id)
        // {
        //     return Ok(await memberRepository.GetAssetsForMemberAsync(id));
        // }

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

        // [HttpPost("add-asset")]
        // public async Task<ActionResult<Asset>> AddAsset([FromForm] IFormFile file)
        // {
        //     var memberId = User.GetUserId();
        //     var member = await memberRepository.GetMemberForUpdateAsync(memberId);
        //     if (member == null) return NotFound();
        //
        //     var result = await assetService.UploadFileAsync(file);
        //
        //     if (!result.IsSuccess) return BadRequest("Failed to upload file");
        //
        //     // TODO: Implement asset creation logic
        //
        //     return BadRequest("Problem adding asset");
        // }

        // [HttpPut("set-main-asset/{assetId}")]
        // public async Task<ActionResult> SetMainAsset(int assetId)
        // {
        //     // TODO: Implement asset management for members
        //     return BadRequest("Not implemented");
        // }

        // [HttpDelete("delete-asset/{assetId}")]
        // public async Task<ActionResult> DeleteAsset(int assetId)
        // {
        //     // TODO: Implement asset deletion for members  
        //     return BadRequest("Not implemented");
        // }
    }


}
