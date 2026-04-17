export default {
  test: {
    coverage: {
      provider: "v8"
    },
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        pretendToBeVisual: true
      }
    }
  }
};
