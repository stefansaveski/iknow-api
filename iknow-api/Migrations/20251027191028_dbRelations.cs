using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace iknow_api.Migrations
{
    /// <inheritdoc />
    public partial class dbRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HighSchool_UserId",
                table: "HighSchool");

            migrationBuilder.DropIndex(
                name: "IX_EnrollmentInfo_UserId",
                table: "EnrollmentInfo");

            migrationBuilder.DropIndex(
                name: "IX_ContactInfo_UserId",
                table: "ContactInfo");

            migrationBuilder.CreateIndex(
                name: "IX_HighSchool_UserId",
                table: "HighSchool",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentInfo_UserId",
                table: "EnrollmentInfo",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContactInfo_UserId",
                table: "ContactInfo",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HighSchool_UserId",
                table: "HighSchool");

            migrationBuilder.DropIndex(
                name: "IX_EnrollmentInfo_UserId",
                table: "EnrollmentInfo");

            migrationBuilder.DropIndex(
                name: "IX_ContactInfo_UserId",
                table: "ContactInfo");

            migrationBuilder.CreateIndex(
                name: "IX_HighSchool_UserId",
                table: "HighSchool",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentInfo_UserId",
                table: "EnrollmentInfo",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactInfo_UserId",
                table: "ContactInfo",
                column: "UserId");
        }
    }
}
