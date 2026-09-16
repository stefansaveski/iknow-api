namespace iknow_api.Models
{
    /// <summary>
    /// The student is reached through the enrolment: enrolled_id -> user_id.
    /// A user_id here would be redundant and could contradict the enrolment,
    /// which is the BCNF violation found during normalization (Phase 5).
    /// </summary>
    public class Payment
    {
        public int Id { get; set; }

        public int EnrollmentInfoId { get; set; }
        public int Amount { get; set; }
        public EnrolledSemesters? EnrolledSemesters { get; set; }
    }
}
