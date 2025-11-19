using System;
using System.Net;
using API.Errors;

namespace API.Middleware;

public class ExceptionMiddleware(RequestDelegate next,
 ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "{message}", ex.Message);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var response = env.IsDevelopment()
                ? new ApiExecpions(context.Response.StatusCode, ex.Message, ex.StackTrace)
                : new ApiExecpions(context.Response.StatusCode, ex.Message, "Internal Server Error");

            var options = new System.Text.Json.JsonSerializerOptions
            {
                PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
            };
                
            await context.Response.WriteAsJsonAsync(response, options);
        }
    }

}
