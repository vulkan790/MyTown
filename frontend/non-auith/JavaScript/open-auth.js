document.addEventListener('DOMContentLoaded', function() {
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input');
      const icon = this.querySelector('.eye-icon');
      if (input.type === 'password') 
      {
        input.type = 'text';
        icon.src = '../images/EyeOpened.png';
        icon.style.height = '25px';
      } 
      else 
      {
        input.type = 'password';
        icon.src = '../images/EyeClosed.png';
        icon.style.height = '30px';
      }
    });
  });

  const authButton = document.querySelector('.register-link');
  if (authButton) {
    authButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
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
      
      const passwordError = document.getElementById('password-error');
      if (!password) 
        {
        passwordError.textContent = 'Пожалуйста, введите пароль';
        passwordError.style.display = 'block';
        isValid = false;
      } 
      else
        passwordError.style.display = 'none';
      
      if (isValid)
        window.location.href = this.getAttribute('href');
    });
  }
});