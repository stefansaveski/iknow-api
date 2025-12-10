using iknow_api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using iknow_api.Services;

namespace iknow_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : Controller
    {
        IUserService _userService;
        public UserController(IUserService userService)
        {
            _userService = userService;
        }
        [Authorize]
        [HttpGet("getUser")]
        public async Task<IActionResult> getUser()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (authHeader.StartsWith("Bearer "))
            {
                var token = authHeader.Substring("Bearer ".Length).Trim();
                // token = your JWT
                var userData = await _userService.GetUserData(token);
                if (userData == null) return Ok(new { info = "can't get info" });
                return Ok(new { User = userData });
            }
            return null;

        }
        //"semesters": [
        //    {
        //      "id": 1,
        //      "semester": "Зимски(2025/2026)",
        //      "direction": "PIT23(2023)",
        //      "quota": "Не плаќа-Редовен(2023)",
        //      "note": "",
        //      "studentCom": "Ги имам си...",
        //      "sum": "0,30",
        //      "paid": "0,00",
        //      "ukim": "",
        //      "createdOn": "22.09.2025",
        //      "dateChanged": "22.09.2025",
        //      "credits": "0,01",
        //      "type": "Ред.",
        //      "doc": "Не",
        //      "doc1": "Не",
        //      "verified": "Не",
        //      "taxes": "0,00",
        //      "signatures": "0/5",
        //      "status": "валиден",
        //      "completed": "Не"
        //    },
        //    ]
        //}
        [Authorize]
        [HttpGet("getSemesters")]
        public async Task<IActionResult> getSemesters()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (authHeader.StartsWith("Bearer "))
            {
                var token = authHeader.Substring("Bearer ".Length).Trim();
                // token = your JWT
                var userData = await _userService.GetUserSemesters(token);
                var results = new List<object>();
                
                for(int i=0; i<userData.Count; i++)
                {
                    var newResult = new
                    {
                        id = userData[i].Id,
                        semester = (userData[i].Type == 0 ? "Зимски" : "Летен") + $"({userData[i].Year}/{userData[i].Year + 1})",
                        direction = userData[i].Major?.Name ?? "",
                        quota = userData[i].QuotaType.ToString(),
                        note = "",
                        studentCom = "",
                        sum = "0,00",
                        paid = "0,00",
                        ukim = "",
                        createdOn = DateTime.Now.ToString("dd.MM.yyyy"),
                        dateChanged = DateTime.Now.ToString("dd.MM.yyyy"),
                        credits = "0,00",
                        type = "Ред.",
                        doc = "Не",
                        doc1 = "Не",
                        verified = "Не",
                        taxes = "0,00",
                        signatures = "0/5",
                        status = "валиден",
                        completed = "Не"
                    };
                    results.Add(newResult);
                }
                if (userData == null) return Ok(new { info = "can't get info" });
                return Ok(new { semesters = results });
            }
            return null;

        }
                //        {
                //    "user": [
                //        {
                //            "id": 2,
                //            "userId": 1,
                //            "user": null,
                //            "year": 2025,
                //            "type": 1,
                //            "quotaType": "privatna",
                //            "majorId": 1,
                //            "major": {
                //                "id": 1,
                //                "name": "PIT(2023)",
                //                "subjects": null
                //            },
                //            "users": null,
                //            "semesterSubjects": null
                //        },
                //        {
                //    "id": 1,
                //            "userId": 1,
                //            "user": null,
                //            "year": 2025,
                //            "type": 0,
                //            "quotaType": "privatna",
                //            "majorId": 1,
                //            "major": {
                //        "id": 1,
                //                "name": "PIT(2023)",
                //                "subjects": null
                //            },
                //            "users": null,
                //            "semesterSubjects": null
                //        }
                //    ]
                //}
    }
}
