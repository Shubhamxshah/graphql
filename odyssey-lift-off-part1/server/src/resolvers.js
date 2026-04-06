const resolvers = {
    Query: {
        tracksForHome: (_, __, {dataSources}) => {
            return dataSources.trackAPI.getTracksForHome();
        },
    }
}