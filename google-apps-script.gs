/**
 * Shanyraq × Rolab — приём заявок с лендинга в Google Таблицу.
 *
 * КАК ПОДКЛЮЧИТЬ (5 минут, один раз):
 * 1. Открой свою таблицу:
 *    https://docs.google.com/spreadsheets/d/1_IgdDkiMFXPQjpzEYjZuNF73jvztqs24lNCcXQE80fU/edit
 * 2. Меню: Расширения → Apps Script.
 * 3. Удали весь код, который там есть, и вставь ВЕСЬ этот файл.
 * 4. Нажми «Сохранить» (значок дискеты).
 * 5. Нажми «Развернуть» (Deploy) → «Новое развёртывание» (New deployment).
 * 6. Тип развёртывания (шестерёнка) → «Веб-приложение» (Web app).
 *    - Описание: любое, напр. "form".
 *    - Запуск от имени (Execute as): Я (от твоего имени).
 *    - У кого есть доступ (Who has access): «Все» (Anyone).
 * 7. Нажми «Развернуть», разреши доступ (Authorize), выбери свой Google-аккаунт,
 *    «Дополнительно» → «Перейти к проекту (небезопасно)» — это нормально, проект твой.
 * 8. Скопируй URL веб-приложения (заканчивается на /exec) и пришли его мне —
 *    я вставлю его в сайт.
 */

// Заголовки колонок (создаются автоматически при первой заявке)
var HEADERS = ['Дата/время', 'Имя родителя', 'Имя ребёнка', 'Возраст', 'Поток', 'WhatsApp'];

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Если лист пустой — добавим строку заголовков
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }

    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date(),
      data.parentName || '',
      data.childName  || '',
      data.age        || '',
      data.slot       || '',
      data.whatsapp   || ''
    ]);

    // Телефон начинается с "+", из-за чего Google Таблица считает его формулой
    // и показывает #ERROR!. Принудительно делаем колонку WhatsApp текстовой,
    // чтобы значение хранилось как обычный текст.
    var phoneCol = HEADERS.indexOf('WhatsApp') + 1; // 1-based
    var lastRow = sheet.getLastRow();
    var cell = sheet.getRange(lastRow, phoneCol);
    cell.setNumberFormat('@'); // формат "Текст"
    cell.setValue(data.whatsapp || '');

    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', message: String(err) });
  }
}

function doGet() {
  return json({ status: 'ok' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
