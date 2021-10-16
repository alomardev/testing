(async function () {
  /* Constants */
  const letters = ['A', 'B', 'C', 'D'];
  const questionFile = 'questions.json';

  /* Utils */
  const letterToIndex = (letter) => letters.indexOf(letter?.toUpperCase());
  const indexToLetter = (index) => letters[index];
  const shuffle = (array) => {
    let currentIndex = array.length
    let randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  /* Templates */
  const questionTemplate = (item) => item.data.question.split('\n').map(q => `<p>${q}</p>`).join('');
  const noteTemplate = (item) => item.data.note?.split('\n').map(n => `<p><em>${n}</em></p>`).join('') ?? '';
  const choicesTemplate = (item, id) => item.data.choices.map((choice, index) => `
  <div class="form-check">
    <input class="form-check-input" type="radio" name="item-answer-${id}" id="item-answer-${id}-${index}" value="${choice.correct ? '1' : '0'}">
    <label class="form-check-label" for="item-answer-${id}-${index}">
      ${choice.label}
    </label>
  </div>
  `).join('');

  const itemTemplate = (item, itemIndex) => `
  <div class="card mt-3" id="item-${itemIndex}" data-item="${itemIndex}"}>
  <div class="card-body">
    <div class="question-block">
      <div class="question">
        ${questionTemplate(item)}
      </div>
      <div class="choices">
        <hr>
        ${choicesTemplate(item, itemIndex)}
      </div>
      <div class="actions">
        <hr>
        <div class="d-flex flex-column-reverse flex-md-row-reverse align-items-md-center">
          <button type="button" class="btn btn-primary flex-shrink-0" id="item-submit-${itemIndex}">Submit Answer</button>
          <button type="button" class="btn btn-outline-primary flex-shrink-0 me-md-2 me-0 mb-2 mb-md-0 ${item.data.note ? '' : 'd-none'}" id="item-toggle-note-${itemIndex}">Toggle Note</button>
          <div class="note me-auto pe-md-3 pe-0 mb-3 mb-md-0 d-none" id="item-note-${itemIndex}">
            ${noteTemplate(item)}
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
  `;

  /* App */
  const questions = await (await fetch(questionFile)).json();
  const total = questions.length;
  const statefulItems = shuffle(questions).map(item => ({
    data: item,
    submitted: false,
    correct: null,
    toggledNote: false,
    elements: {
      root: null,
      note: null,
      noteToggle: null,
      submit: null,
      choices: null,
    }
  }));


  const $correctAnswersCountElement = $('#correct-answers-count');
  const $wrongAnswersCountElement = $('#wrong-answers-count');
  const updateState = () => {
    let totalCorrect = 0;
    let totalWrong = 0;
    statefulItems.forEach(item => {
      if (!item.submitted) return;
      if (item.correct) {
        totalCorrect++;
      }
      if (!item.correct) {
        totalWrong++;
      }
      item.elements.root.toggleClass('correct', item.correct);
      item.elements.root.toggleClass('wrong', !item.correct);
      item.elements.choices.each((_, choiceElement) => {
        if (!$(choiceElement).is(':checked')) return;
        $(choiceElement).toggleClass('is-valid', item.correct);
        $(choiceElement).toggleClass('is-invalid', !item.correct);
      })
    });
    $correctAnswersCountElement.text(totalCorrect);
    $wrongAnswersCountElement.text(totalWrong);
  };

  statefulItems.forEach((item, itemIndex) => {
    const { data } = item;
    data.choices = shuffle(data.choices.map((choice, choiceIndex) => ({ label: choice, correct: choiceIndex === data.answer })));
    const $element = item.elements.root = $(itemTemplate(item, itemIndex));
    const $noteElement = item.elements.note = $element.find(`#item-note-${itemIndex}`);
    const $noteToggle = item.elements.noteToggle = $element.find(`#item-toggle-note-${itemIndex}`);
    const $submitBtn = item.elements.submit = $element.find(`#item-submit-${itemIndex}`);
    item.elements.choices = $element.find(`input[name="item-answer-${itemIndex}"]`);
    $noteToggle.on('click', () => {
      item.toggledNote = !item.toggledNote;
      $noteElement.toggleClass('d-none', item);
    });

    $submitBtn.on('click', () => {
      const isCorrect = $(`input[name="item-answer-${itemIndex}"]:checked`).val() == '1';
      item.submitted = true;
      item.correct = isCorrect;
      updateState();
    });

    $('#content-wrapper').append($element);
  });
})();