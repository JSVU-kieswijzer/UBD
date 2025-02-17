document.addEventListener('DOMContentLoaded', () => {
  fetch('questions.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then((questions) => {
      console.log('Questions loaded:', questions);
      displayQuestions(questions);
    })
    .catch((error) => console.error('Error loading JSON:', error));

  function displayQuestions(questions) {
    const main = document.querySelector('main');

    const questionNumberOverlay = document.querySelector(
      '.question-number-overlay'
    );
    questionNumberOverlay.classList.add('question-number-overlay');
    questionNumberOverlay.style.display = 'none'; // Initially hidden
    document.body.appendChild(questionNumberOverlay);

    const questionNavigation = document.querySelector('.question-navigation');
    questionNavigation.classList.add('question-navigation');
    questionNavigation.style.display = 'none'; // Initially hidden
    document.body.appendChild(questionNavigation);

    questions.forEach((question, index) => {
      const section = document.createElement('div');
      section.classList.add('section');

      const questionContainer = document.createElement('div');
      questionContainer.classList.add('question');
      if (index === 0) questionContainer.classList.add('active'); // Show the first question
      const questionText = document.createElement('h2');
      questionText.textContent = question.text;
      questionContainer.appendChild(questionText);

      if (question.subtext) {
        const questionSubtext = document.createElement('p');
        questionSubtext.textContent = question.subtext;
        questionContainer.appendChild(questionSubtext);
      }

      if (question.type === 'multiple-choice') {
        const selectedAnswers = [];
        question.answers.forEach((answer) => {
          const label = document.createElement('label');
          const input = document.createElement('input');
          input.type = 'button';
          input.name = `question${index}`;
          input.value = answer;

          const span = document.createElement('span');
          span.classList.add('answer-text');
          span.textContent = answer;
          label.appendChild(input);
          label.appendChild(span);
          questionContainer.appendChild(label);

          // Add event listener for click on the label
          label.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default action
            if (input.classList.contains('active')) {
              input.classList.remove('active');
              label.style.backgroundColor = 'white';
              label.style.color = '#005ca8';
              const answerIndex = selectedAnswers.indexOf(input);
              if (answerIndex > -1) {
                selectedAnswers.splice(answerIndex, 1);
              }
            } else {
              if (selectedAnswers.length < question.maxSelections) {
                input.classList.add('active');
                label.style.backgroundColor = '#005ca8';
                label.style.color = 'white';
                selectedAnswers.push(input);
              } else {
                const firstSelected = selectedAnswers.shift();
                firstSelected.classList.remove('active');
                firstSelected.parentElement.style.backgroundColor = 'white';
                firstSelected.parentElement.style.color = '#005ca8';
                input.classList.add('active');
                label.style.backgroundColor = '#005ca8';
                label.style.color = 'white';
                selectedAnswers.push(input);
              }
            }
            console.log(`Button clicked: ${answer}`);
          });

          // Add event listener for hover
          label.addEventListener('mouseover', () => {
            if (!input.classList.contains('active')) {
              label.style.backgroundColor = '#005ca8';
              label.style.color = 'white';
            }
          });

          label.addEventListener('mouseout', () => {
            if (!input.classList.contains('active')) {
              label.style.backgroundColor = 'white';
              label.style.color = '#005ca8';
            }
          });
        });
      } else if (question.type === 'open') {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = `question${index}`;
        questionContainer.appendChild(input);
      }

      section.appendChild(questionContainer);

      const navigation = document.createElement('div');
      navigation.classList.add('navigation');

      const prevButton = document.createElement('button');
      prevButton.textContent = 'Vorige vraag';
      prevButton.classList.add('nav-button'); // Add common class
      prevButton.classList.add('nav-button-left');
      prevButton.addEventListener('click', () => navigateQuestions(index - 1));

      const nextButton = document.createElement('button');
      nextButton.textContent = 'Volgende vraag';
      nextButton.classList.add('nav-button'); // Add common class
      nextButton.classList.add('nav-button-right');
      nextButton.addEventListener('click', () => navigateQuestions(index + 1));

      navigation.appendChild(prevButton);

      if (index === 0) {
        prevButton.disabled = true;
        prevButton.style.visibility = 'hidden';
      }

      if (index === questions.length - 1) {
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Verstuur';
        submitButton.classList.add('nav-button'); // Add common class
        submitButton.classList.add('nav-button-submit');

        submitButton.addEventListener('click', async () => {
          const answers = questions.map((question, index) => {
            const selectedAnswers = Array.from(
              document.querySelectorAll(`input[name="question${index}"].active`)
            ).map((input) => input.value);
            return {
              answers: selectedAnswers,
              calculation: question.calculation, // Include calculation type
              options: question.answers,
            };
          });

          // Check if all questions are answered
          const allAnswered = answers.every(
            (answer) => answer.answers.length > 0
          );

          if (!allAnswered) {
            alert(
              'Beantwoord alle vragen voordat je de vragenlijst verstuurt.'
            );
            return;
          }

          // Show loading animation
          document.querySelector('.start-screen').style.display = 'none';
          document.querySelector('main').style.display = 'none';
          document.querySelector('.question-number-overlay').style.display =
            'none';
          document.querySelector('.question-navigation').style.display = 'none';
          document.getElementById('homeButton').style.display = 'none';
          document.getElementById('loading').style.display = 'flex';

          // Fetch the answersLawFirms.json file
          const response = await fetch('answersLawFirms.json');
          const firms = await response.json();
          console.log('Firms loaded:', firms);

          // Execute matchCalculator with the submitted answers and firms data
          const matchResults = calculateMatch(answers, firms);

          // Show results after 2 seconds
          setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            const resultsDiv = document.getElementById('results');
            resultsDiv.style.display = 'flex';

            const topResults = document.getElementById('top-3-results');
            const otherResults = document.getElementById('other-results');
            topResults.innerHTML = '';
            otherResults.innerHTML = '';

            // Display top 3 matches
            matchResults.slice(0, 3).forEach((result, index) => {
              const firm = firms.find((f) => f.name === result.firm);
              if (firm) {
                console.log('Firm found:', firm);
                const resultDiv = document.createElement('div');
                resultDiv.innerHTML = `<h3><a href="${
                  firm.website.url
                }" target="_blank">${index + 1}. ${
                  result.firm
                }</a></h3> ${result.score.toFixed(2)}% match`;
                topResults.appendChild(resultDiv);
              } else {
                console.error('Firm not found for result:', result.firm);
              }
            });

            // Display other 7 matches
            matchResults.slice(3, 10).forEach((result, index) => {
              const firm = firms.find((f) => f.name === result.firm);
              const resultDiv = document.createElement('div');
              resultDiv.classList.add('result-item');
              //console.log(result.firm + ': ' + firm.link);

              resultDiv.innerHTML = `<h3><a href="${
                firm.website.url
              }" target="_blank">${index + 4}. ${
                result.firm
              } - ${result.score.toFixed(2)}% match</a></h3>`;
              otherResults.appendChild(resultDiv);
            });

            // Add event listener to return button
            document
              .getElementById('returnButton')
              .addEventListener('click', () => {
                location.reload(); // Reload the page
              });
          }, 2000);
        });

        navigation.appendChild(submitButton);
      } else navigation.appendChild(nextButton);

      section.appendChild(navigation);
      main.appendChild(section);

      const navButton = document.createElement('button');
      navButton.textContent = index + 1;
      navButton.addEventListener('click', () => navigateQuestions(index));
      questionNavigation.appendChild(navButton);
    });

    updateQuestionNumber(0, questions.length);
    updateNavigation(0);

    // Add scroll event listener to update navigation on manual scroll
    main.addEventListener('scrollend', () => {
      const sections = document.querySelectorAll('.section');
      let currentIndex = 0;
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
          currentIndex = index;
        }
      });
      updateQuestionNumber(currentIndex, sections.length - 1);
      updateNavigation(currentIndex);
    });
  }

  function navigateQuestions(index) {
    const sections = document.querySelectorAll('.section');
    if (index < 0 || index >= sections.length) return;
    sections.forEach((section, i) => {
      section
        .querySelector('.question')
        .classList.toggle('active', i === index);
    });
    sections[index].scrollIntoView({ behavior: 'smooth' });
    updateQuestionNumber(index, sections.length - 1);
    updateNavigation(index);
  }

  function updateQuestionNumber(current, total) {
    const questionNumberOverlay = document.querySelector(
      '.question-number-overlay'
    );
    questionNumberOverlay.textContent = `${current + 1}/${total + 1}`;
  }

  function updateNavigation(currentIndex) {
    const navButtons = document.querySelectorAll('.question-navigation button');
    navButtons.forEach((button, index) => {
      button.classList.toggle('active', index === currentIndex);
    });
  }

  document.getElementById('startButton').addEventListener('click', () => {
    document.querySelector('.start-screen').style.display = 'none';
    document.querySelector('.question-number-overlay').style.display = 'block';
    document.querySelector('.question-navigation').style.display = 'flex';
    document.getElementById('homeButton').style.display = 'block';
    navigateQuestions(0);
  });

  document.getElementById('homeButton').addEventListener('click', () => {
    document.querySelector('.start-screen').style.display = 'flex';
    document.querySelector('.question-number-overlay').style.display = 'none';
    document.querySelector('.question-navigation').style.display = 'none';
    document.getElementById('homeButton').style.display = 'none';
    navigateQuestions(0);
  });

  document
    .getElementById('startScreenHomeButton')
    .addEventListener('click', () => {
      //show webpage by url
      window.location.href = 'https://www.utrechtsebedrijvendag.nl/nl';
    });

  document
    .getElementById('endScreenHomeButton')
    .addEventListener('click', () => {
      //show webpage by url
      window.location.href = 'https://www.utrechtsebedrijvendag.nl/nl';
    });
});
