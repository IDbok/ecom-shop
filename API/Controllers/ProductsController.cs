using API.DTOs;
using API.DTOs.Products;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class ProductsController(IProductRepository ProductRepository,
        IPhotoService photoService) : BaseApiController
    {
        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<Product>>> GetProducts()
        {
            return Ok(await ProductRepository.GetProductsAsync());
        }

        [HttpGet("{id:long:min(1)}")]
        public async Task<ActionResult<Product>> GetProduct(long id)
        {
            var Product = await ProductRepository.GetProductByIdAsync(id);

            if (Product == null) return NotFound();
            return Product;
        }

        [HttpGet("{id:long:min(1)}/photos")]
        public async Task<ActionResult<IReadOnlyList<Photo>>> GetPhotosForProduct(long id)
        {
            return Ok(await ProductRepository.GetPhotosForProductAsync(id));
        }

        [HttpPut]
        public async Task<ActionResult> UpdateProduct(ProductUpdateDto ProductUpdateDto)
        {
            // Temporarily disabled for testing
            // if (!User.IsInRole("Admin"))
            // {
            //     return Forbid("Only Admins can change the Product fields.");
            // }

            var ProductId = ProductUpdateDto.Id;

            var Product = await ProductRepository.GetProductForUpdateAsync(ProductId);
            if (Product == null) return NotFound();

            // Map the updated fields from DTO to the Product entity
            if (ProductUpdateDto.Article != null && ProductUpdateDto.Article != Product.Article)
            {
                Product.Article = ProductUpdateDto.Article;
            }

            if (ProductUpdateDto.Name != null)
                Product.Name = ProductUpdateDto.Name;

            if (ProductUpdateDto.PackagedWeight.HasValue)
                Product.PackagedWeight = ProductUpdateDto.PackagedWeight.Value;

            if (ProductUpdateDto.PackagedVolume.HasValue)
                Product.PackagedVolume = ProductUpdateDto.PackagedVolume.Value;

            if (ProductUpdateDto.Size != null)
            {
                var dimensions = ProductUpdateDto.Size;

                if (dimensions.WidthMm <= 0 || dimensions.HeightMm <= 0 || dimensions.DepthMm <= 0)
                    return BadRequest("Габариты должны быть > 0.");

                Product.Size = new Dimensions(dimensions.WidthMm, dimensions.HeightMm, dimensions.DepthMm);
            }

            if (ProductUpdateDto.DefaultColor != null)
                Product.DefaultColor = ProductUpdateDto.DefaultColor;

            if (ProductUpdateDto.Category != null)
                Product.Category = ProductUpdateDto.Category;

            if (ProductUpdateDto.Description != null)
                Product.Description = ProductUpdateDto.Description;

            ProductRepository.Update(Product);

            if (await ProductRepository.SaveAllAsync()) {
                Console.WriteLine("\n!!!!! Product updated successfully.\n");
                return NoContent();
            }

            return BadRequest("Failed to update Product");
        }

        [HttpPost("{id:long:min(1)}/update-price")]
        public async Task<ActionResult> UpdateProductPrice(long id, [FromBody] PriceUpdateDto priceUpdateDto)
        {
            // Temporarily disabled for testing
            // if (!User.IsInRole("Admin"))
            // {
            //     return Forbid("Only Admins can change the Product price.");
            // }

            Console.WriteLine($"Received PriceUpdateDto: {System.Text.Json.JsonSerializer.Serialize(priceUpdateDto)}");

            var Product = await ProductRepository.GetProductForUpdateAsync(id);
            if (Product == null) return NotFound();

            if (priceUpdateDto.Amount < 0)
            {
                return BadRequest("Price cannot be negative.");
            }

            // if (priceUpdateDto.Id == null || priceUpdateDto.Id == Guid.Empty)
            // {
            //     // Create new Price
            //     var newPrice = new Price
            //     {
            //         Id = Guid.NewGuid(),
            //         Kind = priceUpdateDto.Kind,
            //         Currency = priceUpdateDto.Currency,
            //         Amount = priceUpdateDto.Amount,
            //         MinQty = priceUpdateDto.MinQty,
            //         ValidFrom = priceUpdateDto.ValidFrom,
            //         ValidTo = priceUpdateDto.ValidTo,
            //         ProductId = Product.Id
            //     };

            //     Product.Price = newPrice;
            // }
            // else
            // {
            //     Product.Price.Kind = priceUpdateDto.Kind;
            //     Product.Price.Amount = priceUpdateDto.Amount;
            //     Product.Price.Currency = priceUpdateDto.Currency;
            //     Product.Price.MinQty = priceUpdateDto.MinQty;
            //     Product.Price.ValidFrom = priceUpdateDto.ValidFrom;
            //     Product.Price.ValidTo = priceUpdateDto.ValidTo;
            // }

            ProductRepository.Update(Product);

            if (await ProductRepository.SaveAllAsync()) return NoContent();

            return BadRequest("Failed to update Product price");
        }


        [HttpPost("{id:long:min(1)}/add-photo")]
        public async Task<ActionResult<Photo>> AddPhoto(long id, [FromForm] IFormFile file)
        {
            var Product = await ProductRepository.GetProductForUpdateAsync(id);
            if (Product == null) return NotFound();

            var result = await photoService.UploadPhotoAsync(file);

            if (result.Error != null) return BadRequest(result.Error.Message);

            var photo = new Photo
            {
                Url = result.SecureUrl.AbsoluteUri,
                PublicId = result.PublicId,
                ProductId = Product.Id
            };

            Product.Photos.Add(photo);

            if (await ProductRepository.SaveAllAsync())
            {
                return CreatedAtAction(nameof(GetProduct), new { id = Product.Id }, photo);
            }

            return BadRequest("Problem adding photo");
        }

        [HttpPut("set-main-photo/{photoId:int:min(1)}")]
        public async Task<ActionResult> SetMainPhoto(int photoId)
        {
            var Product = await ProductRepository.GetProductByPhotoIdAsync(photoId);
            if (Product == null) return NotFound("Product not found");

            var photo = Product.Photos.SingleOrDefault(p => p.Id == photoId);
            if (photo == null) return NotFound("Photo not found");

            if (Product.ImageUrl == photo.Url)
            {
                return BadRequest("This is already your main photo");
            }

            Product.ImageUrl = photo.Url;

            if (await ProductRepository.SaveAllAsync())
            {
                return NoContent();
            }

            return BadRequest("Problem setting main photo");
        }

        [HttpDelete("delete-photo/{photoId}")]
        public async Task<ActionResult> DeletePhoto(int photoId)
        {
            var Product = await ProductRepository.GetProductByPhotoIdAsync(photoId);
            if (Product == null) return NotFound("Product not found");

            var photo = Product.Photos.SingleOrDefault(p => p.Id == photoId);
            if (photo == null) return NotFound("Photo not found");

            if (Product.ImageUrl == photo.Url)
            {
                return BadRequest("You cannot delete your main photo");
            }

            if (photo.PublicId != null)
            {
                var result = await photoService.DeletePhotoAsync(photo.PublicId);
                if (result.Error != null) return BadRequest(result.Error.Message);
            }

            Product.Photos.Remove(photo);

            if (await ProductRepository.SaveAllAsync())
            {
                return Ok();
            }

            return BadRequest("Problem deleting the photo");
        }
    }


}
