export default {
  providers: [
    {
      domain:
        (typeof process !== 'undefined' && process.env.CONVEX_SITE_URL) ||
        'https://backend.chordwise.janjs.dev',
      applicationID: 'convex',
    },
  ],
}
