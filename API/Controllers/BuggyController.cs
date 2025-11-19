using System;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

// controller to test error responses in client
public class BuggyController : BaseApiController
{
    [HttpGet("auth")]
    public ActionResult<string> GetSecret()
    {
        return Unauthorized();
    }

    [HttpGet("not-found")]
    public ActionResult<string> GetNotFound()
    {
        return NotFound();
    }

    [HttpGet("server-error")]
    public ActionResult<string> GetServerError()
    {
        throw new Exception("This is a server error");
    }

    [HttpGet("bad-request")]
    public ActionResult<string> GetBadRequest()
    {
        return BadRequest("This was not a good request");
    }

}
