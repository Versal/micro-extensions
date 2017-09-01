const originalConsoleError = ::console.error
const suppressConsoleError = () => {
  beforeEach(() => {
    console.error = () => {}
  })
  afterEach(() => {
    console.error = originalConsoleError
  })
}

export default suppressConsoleError
