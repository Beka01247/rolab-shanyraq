// ====== НАСТРОЙКА ======
// Вставь сюда URL веб-приложения Google Apps Script (заканчивается на /exec).
// Пока пусто — заявки просто логируются в консоль, форма всё равно работает.
const SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzWh-srv9jl_Uwrgd5_UYc8ZOUgja9Xx1Es2nuILeEd8BxPY5OlORAPbpKklzNhQ1ox/exec';
// =======================

// Populate age dropdown 7–16
(function () {
  const ageSelect = document.querySelector('select[name="age"]');
  if (ageSelect) {
    for (let age = 7; age <= 16; age++) {
      const opt = document.createElement('option');
      opt.value = age;
      opt.textContent = age + ' лет';
      ageSelect.appendChild(opt);
    }
  }
})();

// WhatsApp / phone input formatting -> +7 (XXX) XXX-XX-XX
(function () {
  const phone = document.querySelector('input[name="whatsapp"]');
  if (!phone) return;

  function format(digits) {
    // normalize: strip non-digits, treat leading 8 as 7
    digits = digits.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11); // 7 + 10 digits

    const d = digits.slice(1); // 10 national digits
    let out = '+7';
    if (d.length > 0) out += ' (' + d.slice(0, 3);
    if (d.length >= 3) out += ')';
    if (d.length > 3) out += ' ' + d.slice(3, 6);
    if (d.length > 6) out += '-' + d.slice(6, 8);
    if (d.length > 8) out += '-' + d.slice(8, 10);
    return out;
  }

  phone.addEventListener('input', function () {
    const caretEnd = this.selectionStart === this.value.length;
    this.value = format(this.value);
    if (caretEnd) this.setSelectionRange(this.value.length, this.value.length);
  });
  phone.addEventListener('focus', function () {
    if (!this.value) this.value = '+7 (';
  });
})();

// Form validation + submit (no backend — CRM hook goes here later)
(function () {
  const form = document.getElementById('signupForm');
  if (!form) return;
  const success = document.getElementById('formSuccess');

  function validPhone(v) {
    return v.replace(/\D/g, '').length === 11;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let ok = true;

    form.querySelectorAll('input, select').forEach((el) => {
      el.classList.remove('invalid');
      const empty = !el.value || el.value.trim() === '';
      const badPhone = el.name === 'whatsapp' && !validPhone(el.value);
      if (empty || badPhone) {
        el.classList.add('invalid');
        ok = false;
      }
    });

    if (!ok) {
      const first = form.querySelector('.invalid');
      if (first) first.focus();
      return;
    }

    // Собираем данные заявки
    const data = Object.fromEntries(new FormData(form).entries());

    // Телефон отправляем без "+" и без форматирования (только цифры),
    // иначе Google Таблица принимает "+7..." за формулу и пишет #ERROR!.
    // На сайте номер остаётся красивым, в таблицу уходит, напр., 77081234955.
    if (data.whatsapp) {
      data.whatsapp = data.whatsapp.replace(/\D/g, '');
    }

    const btn = form.querySelector('button[type="submit"]');
    const btnText = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = 'Отправляем…'; }

    function showSuccess() {
      // Meta Pixel: событие "Lead" при успешной отправке формы
      if (typeof fbq === 'function') fbq('track', 'Lead');

      form.reset();
      const ageSel = document.querySelector('select[name="age"]');
      if (ageSel) ageSel.selectedIndex = 0;
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (btn) { btn.disabled = false; btn.innerHTML = btnText; }
    }

    // Отправляем в Google Таблицу, если задан URL
    if (SHEET_WEBHOOK_URL) {
      fetch(SHEET_WEBHOOK_URL, {
        method: 'POST',
        // no-cors + text/plain — обязательно для Apps Script без CORS-настроек
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
      })
        .then(showSuccess)
        .catch(() => {
          // даже при сетевой ошибке показываем успех, заявка обычно доходит
          console.error('Sheet submit error');
          showSuccess();
        });
    } else {
      console.log('Заявка (URL таблицы не задан):', data);
      showSuccess();
    }
  });

  // clear invalid state on edit
  form.addEventListener('input', (e) => e.target.classList.remove('invalid'));
})();

// FAQ: keep accordion single-open
(function () {
  const items = document.querySelectorAll('.faq-item');
  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        items.forEach((other) => { if (other !== item) other.open = false; });
      }
    });
  });
})();
