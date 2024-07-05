document.addEventListener('DOMContentLoaded', () => {
  const phoneInput = document.getElementById('phone');
  phoneInput.addEventListener('input', (event) => {
    event.preventDefault();
    if (phoneInput.validity.patternMismatch) {
      phoneInput.setCustomValidity('Phone number format: (+)0123456789');
    } else {
      phoneInput.setCustomValidity('');
    }
    phoneInput.reportValidity();
  });
});
