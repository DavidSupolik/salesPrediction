export function predictSales(req, res) {
  const inputData = req.body.data;
  const params = req.body.params;

  // customize the 'inputData' into more useful structure
  const originalData = inputData.map((week) => {
    return {
      year: +week.timestamp.substring(0, 4),
      month: +week.timestamp.substring(5, 7),
      day: +week.timestamp.substring(8, 10),
      weekValue: week.value,
    };
  });

  // check across how many different years does the data span
  const yearSet = new Set();
  originalData.forEach((week) => {
    yearSet.add(week.year);
  });
  let yearsAmount = yearSet.size;

  //if the last datapoint in 'originalData' is 29.12-31.12., then the sales values reach into the next year's non-holiday week days, so we have to add one more year. (1.1. is holiday so we dont have to be concerned about that date, and 2.1-3.1. are weekend days if the datapoint is 27.12-28.12, so we only start caring at 29.12 and beyond)
  if (
    originalData[originalData.length - 1].month === 12 &&
    originalData[originalData.length - 1].day >= 29
  ) {
    yearsAmount += 1;
  }

  // --- CREATE 'REFORMATTEDDATA', AN ARRAY OF YEARS (=ARRAYS), IN WHICH EVERY YEAR WILL CONTAIN AN OBJECT FOR EACH OF ITS DAYS, WITH INFORMATION ABOUT HOW MUCH WAS SOLD THAT DAY
  const firstYear = originalData[0].year;
  const reformattedData = [];
  for (let i = 0; i < yearsAmount; i++) {
    reformattedData.push([{ yearNo: firstYear + i }]); //add array that represents a full year. the array so far contains just one object with its year number (= "yearNo")

    let year = reformattedData[reformattedData.length - 1]; //get reference for that newest year (array)
    let month;
    let day;

    //this loop iterates once for each day in a year (if-statements looked more readable here than switch)
    for (let j = 1; j <= 365; j++) {

      if (j === 1) {
        month = 1;
        day = 1;
      } else if (j === 32) {
        month = 2;
        day = 1;
      } else if (j === 60) {
        month = 3;
        day = 1;
      } else if (j === 91) {
        month = 4;
        day = 1;
      } else if (j === 121) {
        month = 5;
        day = 1;
      } else if (j === 152) {
        month = 6;
        day = 1;
      } else if (j === 182) {
        month = 7;
        day = 1;
      } else if (j === 213) {
        month = 8;
        day = 1;
      } else if (j === 244) {
        month = 9;
        day = 1;
      } else if (j === 274) {
        month = 10;
        day = 1;
      } else if (j === 305) {
        month = 11;
        day = 1;
      } else if (j === 335) {
        month = 12;
        day = 1;
      }

      // checking whether the day is a holiday, if it is then set the holiday status to true
      const holiday =
        "j===1 ? true : " +
        "j===121 ? true : " +
        "j===128 ? true : " +
        "j===186 ? true : " +
        "j===187 ? true : " +
        "j===271 ? true : " +
        "j===301 ? true : " +
        "j===321 ? true : " +
        "j===358 ? true : " +
        "j===359 ? true : " +
        "j===360 ? true : false";

      // we add the day into that year array (with its month number and day number, and information about being a holiday or not)
      year.push({
        holiday: eval(holiday),
        month: month,
        day: day,
        value: null,
      });
      day += 1;
    }

    //in case of a leap year, add in the extra day
    if (year[0].yearNo % 4 === 0) {
      year.splice(60, 0, { holiday: false, month: 2, day: 29, value: null });
    }
  }

  //now apply the holidays which have different date each year (these have to be provided in the request body.params, starting at index 2)
  const dynamicHolidayDates = params.slice(2);
  dynamicHolidayDates.forEach((holidayDate) => {
    let targetYear = reformattedData.find(
      (year) => year[0].yearNo === holidayDate.yearNo
    );
    let yearIndex = reformattedData.indexOf(targetYear);
    reformattedData[yearIndex][holidayDate.dayIndex].holiday = true;
  });

  // --- IN EACH WEEK, FIND THE AVERAGE SALES PER WORKDAY (ADJUST FOR HOLIDAYS IF THERE ARE ANY IN THAT WEEK), THEN APPLY THAT AVERAGE TO THOSE DAYS
  for (let i = 0; i < originalData.length; i++) {
    let targetYear = reformattedData.find(
      (year) => year[0].yearNo === originalData[i].year
    );
    let yearIndex = reformattedData.indexOf(targetYear);
    let mondayIndex = reformattedData[yearIndex].indexOf(
      reformattedData[yearIndex].find(
        (week) =>
          week.month === originalData[i].month &&
          week.day === originalData[i].day
      )
    );

    //if this is an ordinary week (not a week that starts at 29.12-31.12., because those would reach into the next year's work days)
    if (originalData[i].month != 12 || !(originalData[i].day >= 29)) {
      let holidayAmount = 0;
      for (let j = 0; j < 5; j++) {
        //check if any of the week days are holidays
        if (
          reformattedData[yearIndex][mondayIndex + j] &&
          reformattedData[yearIndex][mondayIndex + j].holiday
        ) {
          holidayAmount += 1;
        }
      }
      //count the average sales that week per workday, and apply it to the workdays
      let averageWorkdaySales = originalData[i].weekValue / (5 - holidayAmount);
      for (let j = 0; j < 5; j++) {
        if (
          reformattedData[yearIndex][mondayIndex + j] &&
          reformattedData[yearIndex][mondayIndex + j].holiday === false
        ) {
          reformattedData[yearIndex][mondayIndex + j].value =
            averageWorkdaySales;
        }
      }
      //if the week spans across two years and contains workdays in both
    } else {
      let nextYearWorkdays;
      //find out how many workdays does the week contain in the next year (depends on whether the week starts at 29.12., 30.12., or 31.12)
      if (originalData[i].day === 29) {
        nextYearWorkdays = 1;
      } else if (originalData[i].day === 30) {
        nextYearWorkdays = 2;
      } else {
        nextYearWorkdays = 3;
      }
      //these weeks that reach into the following year, always have 4 workdays in them (1.1. is holiday)
      let averageWorkdaySales = originalData[i].weekValue / 4;

      //assign the sales value to the work days in the first year
      for (let j = 0; j < 4 - nextYearWorkdays; j++) {
        reformattedData[yearIndex][mondayIndex + j].value = averageWorkdaySales;
      }
      //assign the sales value to the work days in the next year
      for (let j = 0; j < nextYearWorkdays; j++) {
        reformattedData[yearIndex + 1][2 + j].value = averageWorkdaySales;
      }
    }
  }

  // --- NOW WE KNOW SALES FOR EVERY DAY (APPROXIMATELY), SO WE CAN FIND THE AVERAGE DAILY SALES IN EACH MONTH
  let monthlyAveragesPerWorkday = [];

  //for every year
  for (let i = 0; i < reformattedData.length; i++) {
      //for every month
    for (let j = 1; j <= 12; j++) {
      const monthMembers = reformattedData[i]
        .slice(1)
        .filter((date) => date.month === j && date.value != null);
        //if there is at least 15 days for which we have the sales data
      if (monthMembers.length > 15) {
        let monthTotalValue = 0;
        monthMembers.forEach((member) => (monthTotalValue += member.value));

        monthlyAveragesPerWorkday.push({
          year: reformattedData[i][0].yearNo,
          month: j,
          avgDay: monthTotalValue / monthMembers.length,
        });
      }
    }
  }

  //discard the data that we do not wish to use (must be provided in params at index 0, in either this format: { "name": "useDataSince", "value": "2019-01" }, or { "name": "useDataSince", "value": "" } if we wish to use all the input data)
  if (+params[0].value.length > 0) {
    const acceptYear = +params[0].value.substring(0, 4);
    const acceptMonth = +params[0].value.substring(5);
    monthlyAveragesPerWorkday = monthlyAveragesPerWorkday.filter(
      (dataPoint) =>
        dataPoint.year >= acceptYear && dataPoint.month >= acceptMonth
    );
  }

  // --- SINCE WE NOW HAVE THE AVERAGE SALES IN EACH MONTH (FOR MULTIPLE YEARS), WE CAN FIND THE AVERAGE CHANGE BETWEEN MONTHS (FOR A GIVEN MONTH, HOW DO THE SALES CHANGE COMPARED TO THE PREVIOUS MONTH)
  const seasonality = [
    { placeFiller: 0 },
    { aggregate: 0, datapointAmount: 0, avgChange: 0 },
    { aggregate: 0, datapointAmount: 0, avgChange: 0 },
    { aggregate: 0, datapointAmount: 0, avgChange: 0 },
    { aggregate: 0, datapointAmount: 0, avgChange: 0 },
    { aggregate: 0, datapointAmount: 0, avgChange: 0 },
    { aggregate: 0, datapointAmount: 0, avgChange: 0 },
    { aggregate: 0, datapointAmount: 0, avgChange: 0 },
    { aggregate: 0, datapointAmount: 0, avgChange: 0 },
    { aggregate: 0, datapointAmount: 0, avgChange: 0 },
    { aggregate: 0, datapointAmount: 0, avgChange: 0 },
    { aggregate: 0, datapointAmount: 0, avgChange: 0 },
    { aggregate: 0, datapointAmount: 0, avgChange: 0 },
  ];

  for (let i = 0; i < monthlyAveragesPerWorkday.length; i++) {
      //at the first data point we have no previous month to compare to, so skip  i===0
    if (i != 0) {
      let month = monthlyAveragesPerWorkday[i].month;
      let percentChange =
        monthlyAveragesPerWorkday[i].avgDay /
          (monthlyAveragesPerWorkday[i - 1].avgDay / 100) -
        100;
      seasonality[month].aggregate += percentChange;
      seasonality[month].datapointAmount += 1;
    }
  }

  seasonality.forEach(
    (month) => (month.avgChange = month.aggregate / month.datapointAmount)
  );


  // --- NOW WE HAVE EVERYTHING THAT WAS NEEDED, LETS IDENTIFY FOR WHICH WEEKS/DAYS WE ARE MAKING THE PREDICTION (TO WHAT MONTH DO THEY BELONG, DO THE PREDICTED WEEKS CONTAIN ANY HOLIDAYS)
  const nextTwoWeeks = [];

  //get the date of the day when our original data ends (we will need to move forward 12 days from that day for our prediction)
  const lastDatapointYear = +inputData[
    inputData.length - 1
  ].timestamp.substring(0, 4);
  const lastDatapointMonth = +inputData[
    inputData.length - 1
  ].timestamp.substring(5, 7);
  const lastDatapointDay =
    +inputData[inputData.length - 1].timestamp.substring(8, 10) + 6;
  let monthOverflowPoint;
  if (
    lastDatapointMonth === 4 ||
    lastDatapointMonth === 6 ||
    lastDatapointMonth === 9 ||
    lastDatapointMonth === 11
  ) {
    monthOverflowPoint = 30;
  } else if (lastDatapointMonth === 2) {
    //check for leap year in the case that our original data ended in february
    if (lastDatapointYear % 4 === 0) {
      monthOverflowPoint = 29;
    } else {
      monthOverflowPoint = 28;
    }
  } else {
    monthOverflowPoint = 31;
  }

  //identify the work day dates in the next 12 days
  for (let i = 1; i < 13; i++) {
    //6th and 7th day of the next 12 days are weekend days, so we ignore those cases
    if (i != 6 && i != 7) {
        //if the predicted work days dont overflow into the next month
      if (lastDatapointDay + i <= monthOverflowPoint) {
        nextTwoWeeks.push({
          year: lastDatapointYear,
          month: lastDatapointMonth,
          day: lastDatapointDay + i,
          value: 0,
        });
      } else {
        if (lastDatapointMonth != 12) {
          nextTwoWeeks.push({
            year: lastDatapointYear,
            month: lastDatapointMonth + 1,
            day: lastDatapointDay + i - monthOverflowPoint,
            value: 0,
          });
          //if the predicted work days do overflow into the next month + the last data point in the input data was in december, then they overflow to the next year too
        } else {
          nextTwoWeeks.push({
            year: lastDatapointYear + 1,
            month: 1,
            day: lastDatapointDay + i - monthOverflowPoint,
            value: 0,
          });
        }
      }
    }
  }

  // --- FIND THE DAY AVERAGES FOR OUR PREDICTION (we might not have the average sales for our current month and we also might need the average for the following month, if the predicted days overflow there)
  let dailyAvgInCurrentMonth;
  let dailyAvgInNexttMonth;

  //if we have the average already
  if (
    lastDatapointMonth ===
    monthlyAveragesPerWorkday[monthlyAveragesPerWorkday.length - 1].month
  ) {
    dailyAvgInCurrentMonth =
      monthlyAveragesPerWorkday[monthlyAveragesPerWorkday.length - 1].avgDay;
  } else {
    dailyAvgInCurrentMonth =
      monthlyAveragesPerWorkday[monthlyAveragesPerWorkday.length - 2].avgDay *
      ((100 + seasonality[lastDatapointMonth].avgChange) / 100);
  }

  dailyAvgInNexttMonth =
    dailyAvgInCurrentMonth *
    ((100 + seasonality[lastDatapointMonth + 1].avgChange) / 100);

    //aply the average daily sales to the predicted two weeks
  for (let i = 0; i < nextTwoWeeks.length; i++) {
    if (nextTwoWeeks[i].month === lastDatapointMonth) {
      nextTwoWeeks[i].value = dailyAvgInCurrentMonth;
    } else {
      nextTwoWeeks[i].value = dailyAvgInNexttMonth;
    }
  }

  // --- CHECK FOR HOLIDAYS AND ADJUST FOR THEM
  const staticHolidayList = [
    { day: 1, month: 1 },
    { day: 1, month: 5 },
    { day: 8, month: 5 },
    { day: 5, month: 7 },
    { day: 6, month: 7 },
    { day: 28, month: 9 },
    { day: 28, month: 10 },
    { day: 17, month: 11 },
    { day: 24, month: 12 },
    { day: 25, month: 12 },
    { day: 26, month: 12 },
  ];
  //apply static holidays
  nextTwoWeeks.forEach((day) => {
    staticHolidayList.forEach((holiday) => {
      if (day.month === holiday.month && day.day === holiday.day) {
        day.value = 0;
      }
    });
  });

  //if any dynamic holidays were provided in params, apply those
  if (params[1].list.length > 0) {
    const dynamicHolidays = params[1].list.split(";");
    nextTwoWeeks.forEach((day) => {
      dynamicHolidays.forEach((holiday) => {
        if (
          day.month === +holiday.substring(0, 2) &&
          day.day === +holiday.substring(3)
        ) {
          day.value = 0;
        }
      });
    });
  }

  // --- APPEND OUR PREDICTION TO THE ORIGINAL DATA
  let firstWeekSalesValue = 0;
  let secondWeekSalesValue = 0;
  for (let i = 0; i < nextTwoWeeks.length; i++) {
    if (i < 5) {
        firstWeekSalesValue += nextTwoWeeks[i].value;
    } else {
        secondWeekSalesValue += nextTwoWeeks[i].value;
    }
  }
  firstWeekSalesValue = Math.round(firstWeekSalesValue);
  secondWeekSalesValue = Math.round(secondWeekSalesValue);

  //add the 0's if needed to have the correct format on the repsponse output data (day 7 ---> day 07)
  let firstWeekDayNo = `${nextTwoWeeks[0].day}`;
  if (firstWeekDayNo.length === 1) {
    firstWeekDayNo = "0" + firstWeekDayNo;
  }
  let secondWeekDayNo = `${nextTwoWeeks[5].day}`;
  if (secondWeekDayNo.length === 1) {
    secondWeekDayNo = "0" + secondWeekDayNo;
  }

  let firstWeekMonthNo = `${nextTwoWeeks[0].month}`;
  if (firstWeekMonthNo.length === 1) {
    firstWeekMonthNo = "0" + firstWeekMonthNo;
  }
  let secondWeekMonthNo = `${nextTwoWeeks[5].month}`;
  if (secondWeekMonthNo.length === 1) {
    secondWeekMonthNo = "0" + secondWeekMonthNo;
  }

  const prediction = [
    {
      timestamp: `${nextTwoWeeks[0].year}-${firstWeekMonthNo}-${firstWeekDayNo}T00:00:00.000Z`,
      value: firstWeekSalesValue,
    },
    {
      timestamp: `${nextTwoWeeks[5].year}-${secondWeekMonthNo}-${secondWeekDayNo}T00:00:00.000Z`,
      value: secondWeekSalesValue,
    },
  ];

  res.send(inputData.concat(prediction));
}
