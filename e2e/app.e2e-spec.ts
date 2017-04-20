import { AngularCliEjectedStarterPage } from './app.po';

describe('angular-cli-ejected-starter App', () => {
  let page: AngularCliEjectedStarterPage;

  beforeEach(() => {
    page = new AngularCliEjectedStarterPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
