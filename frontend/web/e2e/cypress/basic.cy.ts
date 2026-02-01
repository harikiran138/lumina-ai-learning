describe('Basic Test', () => {
  it('should load the home page', () => {
    cy.visit('/');
    cy.contains('Lumina').should('be.visible');
    cy.get('h1').contains('The Future of Learning').should('be.visible');
  });

  it('should navigate to login page', () => {
    cy.visit('/');
    cy.contains('Get Started').click();
    cy.url().should('include', '/login');
  });
});
