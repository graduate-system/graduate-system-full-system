namespace Api.Committee;

public static class CommitteeAuthExtensions
{
    public static RouteHandlerBuilder RequireCommitteeSession(this RouteHandlerBuilder builder)
        => builder.AddEndpointFilter<CommitteeAuthFilter>();

    public static RouteGroupBuilder RequireCommitteeSession(this RouteGroupBuilder builder)
        => builder.AddEndpointFilter<CommitteeAuthFilter>();
}

