using iknow_api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using iknow_api.Services;

namespace iknow_api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class UserController : Controller
    {
        IUserService _userService;
        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        //  "birthInfo": {
        //    "placeOfBirth": "Скопје",
        //    "municipalityOfBirth": "Скопје",
        //    "country": "Република Северна Македонија"
        //  },
        //  "previousEducation": {
        //    "type": "Гимназиско образование",
        //    "profession": "",
        //    "average": "54,857",
        //    "language": "Македонски",
        //    "country": "",
        //    "previousUniversity": "Гимназиско образование",
        //    "previousFaculty": "",
        //    "previousStudyMode": ""
        //  },
        //  "enrollmentInfo": {
        //    "enrollmentYear": "2023",
        //    "status": "Редовен",
        //    "cycle": "Прв циклус",
        //    "program": "Примена на информациски технологии",
        //    "quota": "Кофинансирање-Редовен (2023, 24600)",
        //    "secondaryEducationNumber": "",
        //    "previousEducationCredits": ""
        //  },
        //  "contact": {
        //    "placeOfResidence": "Скопје",
        //    "municipalityOfResidence": "Кисела Вода - Скопје",
        //    "country": "Република Северна Македонија",
        //    "address": "Драчево",
        //    "temporaryAddress": "",
        //    "phone": "",
        //    "mobilePhone": "075295582",
        //    "passportNumber": "",
        //    "passportExpiryDate": "",
        //    "email": "stefansaveski19@gmail.com",
        //    "microsoftEmail": "stefan.saveski@students.finki.ukim.mk"
        //  }
        //}
        
        [HttpGet("getUser")]
        public async Task<IActionResult> getUser()
        {
            //{
            //  "personalInfo": {
            //    "index": "233149/2023",
            //    "embg": "/////////////",
            //    "lastName": "Савески",
            //    "middleName": "Дејан",
            //    "firstName": "Стефан",
            //    "maidenName": "",
            //    "dateOfBirth": "19.08.2004",
            //    "gender": "машки",
            //    "nationality": "Македонец",
            //    "citizenship": "Република Северна Македонија",
            //    "scholarship": "Користи",
            //    "currentPlan": "2023",
            //    "registryNumber": "",
            //    "notes": "Систематски преглед Студира 3 години",
            //    "studyGroup": ""
            //  },
            var authHeader = Request.Headers["Authorization"].ToString();
            if (authHeader.StartsWith("Bearer "))
            {
                var token = authHeader.Substring("Bearer ".Length).Trim();
                // token = your JWT
                var userData = await _userService.GetUserData(token);
                if (userData == null) return Ok(new { info = "can't get info" });
                var personalInfo = new
                {
                    index = userData.Index ?? "",
                    embg = userData.EMBG ?? "",
                    lastName = userData.Surname ?? "",
                    middleName = userData.MiddleName ?? "",
                    firstName = userData.Name ?? "",
                    maidenName = "", // Property doesn't exist in User model
                    dateOfBirth = userData.Bday.ToString("dd.MM.yyyy"),
                    gender = userData.Gender ?? "",
                    nationality = userData.Nationality ?? "",
                    citizenship = userData.Citizenship ?? "",
                    scholarship = "",
                    currentPlan = userData.EnrollmentInfo?.EnrollmentYear.ToString() ?? "",
                    registryNumber = "",
                    notes = "",
                    studyGroup = ""
                };
                var birthInfo = new
                {
                    placeOfBirth = userData.ContactInfo?.City ?? "",
                    municipalityOfBirth = userData.ContactInfo?.Municipality ?? "",
                    country = userData.Citizenship ?? ""
                };
                var previousEducation = new
                {
                    type = userData.HighSchool?.HighSchoolType.ToString() ?? "",
                    profession = "",
                    average = userData.HighSchool?.GPA.ToString() ?? "",
                    language = userData.Nationality ?? "",
                    country = userData.Nationality ?? "",
                    previousUniversity = userData.HighSchool?.HighSchoolType.ToString() ?? "",
                    previousFaculty = "", // Property doesn't exist in HighSchool model
                    previousStudyMode = "" // Property doesn't exist in HighSchool model
                };
                var enrollmentInfo = new
                {
                    enrollmentYear = userData.EnrollmentInfo?.EnrollmentYear.ToString() ?? "",
                    status = userData.EnrollmentInfo?.StudyStatus ?? "",
                    cycle = "Прв циклус",
                    program = userData.EnrollmentInfo?.Major?.Name ?? "",
                    quota = userData.EnrollmentInfo?.Quota.ToString() ?? "",
                    secondaryEducationNumber = "",
                    previousEducationCredits = ""
                };
                var contact = new
                {
                    placeOfResidence = userData.ContactInfo?.City ?? "",
                    municipalityOfResidence = userData.ContactInfo?.Municipality ?? "",
                    country = userData.Citizenship ?? "",
                    address = userData.ContactInfo?.Address ?? "",
                    temporaryAddress = "",
                    phone = "",
                    mobilePhone = userData.ContactInfo?.PhoneNumber ?? "",
                    passportNumber = "",
                    passportExpiryDate = "",
                    email = userData.Email ?? "",
                    microsoftEmail = userData.ContactInfo?.MicrosoftEmail ?? ""
                };
                return Ok(new { personalInfo = personalInfo, birthInfo = birthInfo, previousEducation = previousEducation, enrollmentInfo = enrollmentInfo, contact = contact });
                //return Ok(new { User = userData });
            }
            return null;

        }
        
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

                for (int i = 0; i < userData.Count; i++)
                {
                    var newResult = new
                    {
                        id = userData[i].Id,
                        semester = (userData[i].Semester.Type == 0 ? "Зимски" : "Летен") + $"({userData[i].Semester.Year}/{userData[i].Semester.Year + 1})",
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

        
        [HttpGet("getSubjects")]
        public async Task<IActionResult> getSubjects()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            var token = authHeader.Substring("Bearer ".Length).Trim();
            // token = your JWT
            var userData = await _userService.GetUserSemesters(token);
            var results = new List<object>();
            var random = new Random();
            for (int i = 0; i < userData.Count; i++)
            {
                var newResult = new
                {
                    id = userData[i].Id,
                    name = (userData[i].Semester.Type == 0 ? "Зимски" : "Летен") + $"({userData[i].Semester.Year}/{userData[i].Semester.Year + 1})",
                    status = "валиден",
                    serviceNumber = 1000000 + random.Next(10000, 100000)
                };
                results.Add(newResult);
            }
                
            
            var subjectsBySemester = new Dictionary<string, List<object>>();

            foreach (var enrollment in userData)
            {
                // Create semester key like "winter_2025_2026" or "summer_2025_2026"
                var semesterType = enrollment.Semester.Type == 0 ? "winter" : "summer";
                var semesterKey = $"{semesterType}_{enrollment.Semester.Year}_{enrollment.Semester.Year + 1}";

                // Initialize list if this semester key doesn't exist
                if (!subjectsBySemester.ContainsKey(semesterKey))
                {
                    subjectsBySemester[semesterKey] = new List<object>();
                }

                // Add subjects from this semester enrollment
                if (enrollment.SemesterSubjects != null)
                {
                    foreach (var semesterSubject in enrollment.SemesterSubjects)
                    {
                        var subject = semesterSubject.Subject;
                        if (subject != null)
                        {
                            var subjectData = new
                            {
                                id = subject.Id,
                                code = subject.Code ?? "",
                                hours = "2+4", // You may need to add this to your Subject model
                                kojPat = 1, // You may need to add this field
                                name = subject.Name ?? "",
                                semester = 5, // You may need to calculate or add this field
                                status = "Зад.", // Determine based on PassedSubject or other logic
                                signature = semesterSubject.Signature ? "Да" : "Не",
                                group = "", // You may need to add this field
                                professor = semesterSubject.Professor?.Name + " " + semesterSubject.Professor?.Surname ?? "",
                            };
                            subjectsBySemester[semesterKey].Add(subjectData);
                        }
                    }
                }
                
            }
            var currentSemester = userData.FirstOrDefault(); // Get the most recent/current semester
            var semesterTypeGlobal = currentSemester.Semester.Type == 0 ? "winter" : "summer";
            var semesterData = new
            {
                id = $"{semesterTypeGlobal}_{currentSemester.Semester.Year}_{currentSemester.Semester.Year + 1}",
                name = (currentSemester.Semester.Type == 0 ? "Зимски" : "Летен") + $" ({currentSemester.Semester.Year}/{currentSemester.Semester.Year + 1})",
                status = "валиден",
                serviceNumber = (1000000 + random.Next(10000, 100000)).ToString(),
                ticketNumber = random.Next(100000, 1000000).ToString(),
                debt = "0,00",
                financialInfo = new
                {
                    sum = 1,
                    paid = "0,00",
                    due = "0,00",
                    materialCosts = "Осигурување, Административна такса, Тетратки (испити), зимски семестар: 1000,00",
                    credits = "30,00",
                    totalCredits = "30,00",
                    MKSA = "750,00",
                    electronicRegistration = "100,00",
                    eUKIM = "350,00",
                    bankProvision = "25,00",
                    total = "2226,00"
                }
            };
            if (userData == null) return Ok(new { info = "can't get info" });
            //return Ok(new { semester = userData });
            return Ok(new { semesters = results, currentSemestar = semesterData, subjectsBySemester = subjectsBySemester });
        }

        
        [HttpGet("getPassedSubjects")]
        public async Task<IActionResult> getPassedSubjects()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (!authHeader.StartsWith("Bearer "))
                return Unauthorized();

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var passedSubjects = await _userService.GetUserPassedSubjects(token);

            if (passedSubjects == null || !passedSubjects.Any())
                return Ok(new { info = "No passed subjects found", passedSubjects = new List<object>() });

            var results = new List<object>();

            foreach (var passed in passedSubjects)
            {
                if (passed.SemesterSubject?.Subject != null)
                {
                    var result = new
                    {
                        id = passed.Id,
                        subjectId = passed.SemesterSubject.Subject.Id,
                        code = passed.SemesterSubject.Subject.Code ?? "",
                        subject = passed.SemesterSubject.Subject.Name ?? "",
                        credits = passed.SemesterSubject.Subject.AwardedCredits ?? 0,
                        grade = (int)passed.Grade,
                        gradeText = passed.Grade.ToString(),
                        date = passed.DatePassed.ToString("dd.MM.yyyy"),
                        semester = passed.SemesterSubject.EnrolledSemester?.Semester != null
                            ? (passed.SemesterSubject.EnrolledSemester.Semester.Type == 0 ? "Зимски" : "Летен") + 
                              $" ({passed.SemesterSubject.EnrolledSemester.Semester.Year}/{passed.SemesterSubject.EnrolledSemester.Semester.Year + 1})"
                            : "",
                        professor = passed.SemesterSubject.Professor != null
                            ? $"{passed.SemesterSubject.Professor.Name} {passed.SemesterSubject.Professor.Surname}".Trim()
                            : ""
                    };
                    results.Add(result);
                }
            }

            return Ok(new { passedSubjects = results });
        }

    }
}
