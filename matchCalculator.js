function calculateMatch(student, firms) {
  return firms
    .map((firm) => {
      let totalScore = 0;
      let maxScore = 0;

      for (let i = 0; i < student.length; i++) {
        const studentAnswer = student[i].answers || [];
        const firmAnswer = firm.answers[i] || [];
        const calculationType = student[i].calculation || [];
        const options = student[i].options || [];

        let score = 0;

        if (calculationType === 'multiple') {
          // Multiple-choice: Score based on overlap percentage
          const overlap = studentAnswer.filter((answer) =>
            firmAnswer.includes(answer)
          ).length;
          const totalPossible = new Set([...studentAnswer, ...firmAnswer]).size;
          score = totalPossible > 0 ? (overlap / totalPossible) * 100 : 0;
          // console.log(
          //   `Multiple: overlap=${overlap}, totalPossible=${totalPossible}, score=${score}`
          // );
          totalScore += score;
          maxScore += 100;
        } else if (calculationType === 'weighted') {
          // Dynamic weighted scoring based on available options
          const weightScale = Object.fromEntries(
            options.map((opt, index) => [opt, index + 1])
          );
          const maxDifference = options.length - 1;

          if (studentAnswer.length > 0 && firmAnswer.length > 0) {
            if (weightScale[studentAnswer[0]] && weightScale[firmAnswer[0]]) {
              const difference = Math.abs(
                weightScale[studentAnswer[0]] - weightScale[firmAnswer[0]]
              );
              score = 100 - (difference / maxDifference) * 100;
              // console.log(
              //   `Weighted: studentAnswer=${studentAnswer[0]}, firmAnswer=${firmAnswer[0]}, difference=${difference}, score=${score}`
              // );
            }
          }
          totalScore += score;
          maxScore += 100;
        } else if (calculationType === 'exact') {
          // Exact match required (100% or 0%)
          score =
            JSON.stringify(studentAnswer) === JSON.stringify(firmAnswer)
              ? 100
              : 0;
          // console.log(
          //   `Exact: studentAnswer=${studentAnswer}, firmAnswer=${firmAnswer}, score=${score}`
          // );
          totalScore += score;
          maxScore += 100;
        }
      }

      const matchPercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      // console.log(
      //   `Firm: ${firm.name}, totalScore=${totalScore}, maxScore=${maxScore}, matchPercentage=${matchPercentage}`
      // );

      return {
        firm: firm.name,
        score: matchPercentage,
      };
    })
    .sort((a, b) => b.score - a.score);
}
