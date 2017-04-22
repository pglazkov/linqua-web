import { LinquaPage } from './app.po';

describe('linqua App', () => {
  let page: LinquaPage;

  beforeEach(() => {
    page = new LinquaPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
