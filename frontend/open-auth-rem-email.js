document.addEventListener('DOMContentLoaded', function() {
  const nextButton = document.querySelector('.next-link');
  if (nextButton) 
  {
    nextButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      let isValid = true;
      
      const emailError = document.getElementById('email-error');
      if (!email) 
      {
        emailError.textContent = 'Пожалуйста, введите email';
        emailError.style.display = 'block';
        isValid = false;
      }
      else
        emailError.style.display = 'none';
      
      if (isValid)
        window.location.href = this.getAttribute('href');
    });
  }
});