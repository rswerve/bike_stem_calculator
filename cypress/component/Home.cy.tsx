import Home from '../../pages/index';

describe('Home.cy.tsx', () => {
  it('playground', () => {
    cy.mount(<Home />);
  })
})