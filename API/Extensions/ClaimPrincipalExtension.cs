using System;
using System.Security.Claims;

namespace API.Extensions;

public static class ClaimPrincipalExtension
{
    public static string GetUserId(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.NameIdentifier) 
            // Usually should not be null, but adding a check just in case
            ?? throw new Exception("User ID claim not found"); 
    }
}
