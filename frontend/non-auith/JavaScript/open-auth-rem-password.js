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

  const authButton = document.querySelector('.next-link');
  if (authButton) 
  {
    authButton.addEventListener('click', function(e) {
      e.preventDefault();
      let isValid = true;

      const fields = [
        { 
          id: 'password',
          errorId: 'password-error',
          emptyMessage: 'Пожалуйста, введите пароль',
          validation: (value) => {
            if (value.length < 6) return 'Пароль должен содержать не менее 6 символов';
            return true;
          }
        },
        { 
          id: 'confirm-password',
          errorId: 'confirm-error',
          emptyMessage: 'Пожалуйста, подтвердите пароль',
          validation: (value) => {
            const password = document.getElementById('password').value;
            if (value !== password) return 'Пароли не совпадают';
            return true;
          }
        }
      ];

      fields.forEach(field => {
        const input = document.getElementById(field.id);
        let errorElement = document.getElementById(field.errorId);
        
        if (!errorElement) 
        {
          errorElement = document.createElement('div');
          errorElement.id = field.errorId;
          errorElement.className = 'error-message';
          input.insertAdjacentElement('afterend', errorElement);
        }

        const value = input.value.trim();
        
        if (!value) 
        {
          showError(input, errorElement, field.emptyMessage);
          isValid = false;
          return;
        }
        
        const validationResult = field.validation(value);
        if (validationResult !== true) 
        {
          showError(input, errorElement, validationResult);
          isValid = false;
          return;
        }
        
        hideError(input, errorElement);
      });

      if (isValid)
        window.location.href = this.getAttribute('href');
    });
  }

  function showError(input, errorElement, message) {
    input.classList.add('input-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    const inputWrapper = input.closest('.password-input-wrapper');
    if (inputWrapper) {
      inputWrapper.insertAdjacentElement('afterend', errorElement);
    }
  }

  function hideError(input, errorElement) {
    input.classList.remove('input-error');
    errorElement.style.display = 'none';
  }

  document.querySelectorAll('#password, #confirm-password').forEach(input => {
    input.addEventListener('input', function() {
      const errorId = this.id + '-error';
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        hideError(this, errorElement);
      }
    });
  });
});