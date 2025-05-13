document.addEventListener('DOMContentLoaded', function() {
  const nextButton = document.querySelector('.next-link');
  if (nextButton) 
  {
    nextButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      const emailInput = document.getElementById('email');
      const email = emailInput.value.trim();
      const emailError = document.getElementById('email-error');
      let isValid = true;
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!email) 
      {
        emailError.textContent = 'Пожалуйста, введите email';
        emailError.style.display = 'block';
        emailInput.classList.add('error');
        isValid = false;
      } 
      else if (!emailRegex.test(email)) 
      {
        emailError.textContent = 'Пожалуйста, введите корректный email';
        emailError.style.display = 'block';
        emailInput.classList.add('error');
        isValid = false;
      } 
      else 
      {
        emailError.style.display = 'none';
        emailInput.classList.remove('error');
      }
      
      if (isValid)
        window.location.href = this.getAttribute('href');
    });
  
    const emailInput = document.getElementById('email');
    emailInput.addEventListener('input', function() {
      const emailError = document.getElementById('email-error');
      emailError.style.display = 'none';
      this.classList.remove('error');
    });
  }
});