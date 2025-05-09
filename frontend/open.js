document.addEventListener('DOMContentLoaded', function() {
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input');
      const icon = this.querySelector('.eye-icon');
      if (input.type === 'password') 
      {
        input.type = 'text';
        icon.src = 'images/EyeOpened.png';
        icon.style.height = '25px';
      } 
      else 
      {
        input.type = 'password';
        icon.src = 'images/EyeClosed.png';
        icon.style.height = '30px';
      }
    });
  });

  const form = document.getElementById('registrationForm');
  const registerLink = document.querySelector('.register-link');
  
  registerLink.addEventListener('click', function(e) {
    e.preventDefault();
    let isValid = true;

    const requiredFields = [
      { id: 'lastname', errorId: 'lastname-error', message: 'Пожалуйста, введите фамилию' },
      { id: 'firstname', errorId: 'firstname-error', message: 'Пожалуйста, введите имя' },
      { id: 'email', errorId: 'email-error', message: 'Пожалуйста, введите email' },
      { id: 'password', errorId: 'password-error', message: 'Пожалуйста, введите пароль' }
    ];

    requiredFields.forEach(field => {
      const input = document.getElementById(field.id);
      const error = document.getElementById(field.errorId);
      if (!input.value.trim()) 
        {
        input.classList.add('error');
        error.textContent = field.message;
        error.style.display = 'block';
        isValid = false;
      } 
      else 
      {
        input.classList.remove('error');
        error.style.display = 'none';
      }
    });

    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');
    const confirmError = document.getElementById('confirm-password-error');
    
    if (password.value !== confirmPassword.value && confirmPassword.value.trim()) 
    {
      confirmPassword.classList.add('error');
      confirmError.textContent = 'Пароли не совпадают';
      confirmError.style.display = 'block';
      isValid = false;
    } 
    else 
    {
      confirmPassword.classList.remove('error');
      confirmError.style.display = 'none';
    }

    const agreement = document.getElementById('agreement');
    const agreementError = document.getElementById('agreement-error');
    if (!agreement.checked) {
      agreementError.style.display = 'block';
      isValid = false;
    } 
    else
      agreementError.style.display = 'none';

    if (isValid)
      window.location.href = this.getAttribute('href');
  });

  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', function() {
      if (this.value.trim()) 
      {
        this.classList.remove('error');
        const errorId = this.id + '-error';
        const errorElement = document.getElementById(errorId);
        if (errorElement)
          errorElement.style.display = 'none';
      }
    });
  });

  document.getElementById('agreement').addEventListener('change', function() {
    if (this.checked)
      document.getElementById('agreement-error').style.display = 'none';
  });
});