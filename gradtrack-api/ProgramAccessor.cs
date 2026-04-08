// Makes the auto-generated Program class visible to the test project
// so WebApplicationFactory<Program> can boot the real pipeline.
using System.Runtime.CompilerServices;
[assembly: InternalsVisibleTo("Api.Tests")]
