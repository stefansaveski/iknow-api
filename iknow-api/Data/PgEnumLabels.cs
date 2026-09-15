using iknow_api.Models;
using Npgsql;

namespace iknow_api.Data
{
    /// <summary>
    /// Maps CLR enum member names onto the labels declared in sql/ddl.sql.
    /// Most labels are just the lowercased member name; the ones that are not
    /// (UserRole.Professor -> 'prof', Grade.Ten -> '10') are listed explicitly.
    ///
    /// The instances are static on purpose. EF Core caches its internal service
    /// provider against the DbContext options, and a fresh translator instance
    /// on every resolution makes each set of options look different - EF then
    /// builds a new provider per resolution and throws
    /// ManyServiceProvidersCreatedWarning once it has built twenty.
    /// </summary>
    public sealed class PgEnumLabels : INpgsqlNameTranslator
    {
        public static readonly PgEnumLabels UserRole = new(
            new Dictionary<string, string>
            {
                [nameof(Models.UserRole.Admin)] = "admin",
                [nameof(Models.UserRole.Professor)] = "prof",
                [nameof(Models.UserRole.Student)] = "student",
            });

        public static readonly PgEnumLabels Grade = new(
            new Dictionary<string, string>
            {
                [nameof(Models.Grade.Six)] = "6",
                [nameof(Models.Grade.Seven)] = "7",
                [nameof(Models.Grade.Eight)] = "8",
                [nameof(Models.Grade.Nine)] = "9",
                [nameof(Models.Grade.Ten)] = "10",
            });

        /// <summary>Lowercases the member name, which is all the other enums need.</summary>
        public static readonly PgEnumLabels Lowercase = new(new Dictionary<string, string>());

        private readonly IReadOnlyDictionary<string, string> _labels;

        private PgEnumLabels(IReadOnlyDictionary<string, string> labels) => _labels = labels;

        public string TranslateTypeName(string clrName) => clrName;

        public string TranslateMemberName(string clrName) =>
            _labels.TryGetValue(clrName, out var label) ? label : clrName.ToLowerInvariant();
    }
}
