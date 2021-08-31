export class Calculations {

  calculateAverage(wbData): number {
    let sum = 0.0;
    wbData.forEach(datum => {
      sum += datum['concentration'];
    });
    return this.roundValue(sum / wbData.length);
  }

  calculateStdDev(wbData): number {
    let average = this.calculateAverage(wbData);
    let diffSum = 0.0;
    wbData.forEach(datum => {
      diffSum += Math.pow(datum['concentration'] - average, 2)
    });
    return this.roundValue(Math.sqrt(diffSum / wbData.length));
  }

  calculateRangeArea(dataByRange, chartLabels) {
    /*
    Calculates sq. area for each concentration range.
    Each pixel is 300m x 300m (0.09 sq. km).
    */
    for (let key in dataByRange) {
      if (!chartLabels.includes(key)) { continue; }
      dataByRange[key].areaPerRange = 0.09 * dataByRange[key].countSum;
    }
    return dataByRange;
  }

  calculatePercentOfArea(dataByRange, chartLabels) {
    /*
    Calcuates the percent area of each range compared to
    the total area (using pixel values, not actual/recorded WB area).
    */
    for (let key in dataByRange) {
      if (!chartLabels.includes(key)) { continue; }
      dataByRange[key].percentOfArea = this.roundValue(100.0 * (dataByRange[key].areaPerRange / dataByRange.totalPixelArea));
    }
    return dataByRange;
  }

  calculatePercentOfTotalArea(dataByRange, wbProps) {
    /*
    Calculates percent of area for cyano counts relative
    to the area of the WB itself.
    */
    dataByRange.percentOfTotalArea = this.roundValue(100.0 * (dataByRange.totalPixelArea / wbProps.areasqkm));
    return dataByRange;
  }

  calculateAverageForRange(dataByRange, chartLabels) {
    /*
    Calculates average cyano levels per range.
    */
    for (let key in dataByRange) {
      if (!chartLabels.includes(key)) { continue; }
      dataByRange[key].average = this.roundValue(this.calculateAverage(dataByRange[key].data));
    }
    return dataByRange;
  }

  calculateStddevForRange(dataByRange, chartLabels) {
    /*
    Calculates Stddev cyano levels per range.
    */
    for (let key in dataByRange) {
      if (!chartLabels.includes(key)) { continue; }
      dataByRange[key].stddev = this.roundValue(this.calculateStdDev(dataByRange[key].data));
    }
    return dataByRange;
  }

  calculateMinForRange(dataByRange, chartLabels) {
    for (let key in dataByRange) {
      if (!chartLabels.includes(key)) { continue; }
      let filteredArray = dataByRange[key].data
        .filter(obj => obj.count > 0)
        .map(obj => obj.concentration);
      if (filteredArray.length < 1) {
        dataByRange[key].min = null;
      }
      else {
       dataByRange[key].min = Math.min(...filteredArray); 
      }
    }
    return dataByRange
  }

  calculateMaxForRange(dataByRange, chartLabels) {
    for (let key in dataByRange) {
      if (!chartLabels.includes(key)) { continue; }
      let filteredArray = dataByRange[key].data
        .filter(obj => obj.count > 0)
        .map(obj => obj.concentration);
      if (filteredArray.length < 1) {
        dataByRange[key].max = null;
      }
      else {
       dataByRange[key].max = Math.max(...filteredArray); 
      }
    }
    return dataByRange
  }

  roundValue(value: number): number {
    /*
    Rounds value to two decimal places.
    */
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  calculateConcentration(index: number) {
    /*
    Calculates concentration (cells/ml) for each pixel value.
    */
    return Math.pow(10, 8) * Math.pow(10, (3.0 / 250) * index - 4.2);
  }

  getDayOfYear(date: string) {
    /*
    Returns the day number out of the year (1..365/366) from a date (MM/DD/YYYY).
    */
    if (!date) {
      return null;
    }
    let dateArray = date.split('/').map(item => parseFloat(item));
    let d = new Date(dateArray[2], dateArray[0] - 1, dateArray[1])
    let start = new Date(d.getFullYear(), 0, 0);
    let diff = (d.getTime() - start.getTime()) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000);
    let oneDay = 1000 * 60 * 60 * 24;
    let day = Math.floor(diff / oneDay);
    return dateArray[2] + ' ' + day;
  }

  getDateFromDayOfYear(date: string) {
    /*
    Returns date (YYYY-MM-DD) from a year and day of year.
    */

    let year = parseFloat(date.split(' ')[0])
    let dayOfYear = parseFloat(date.split(' ')[1])

    let initDate: Date = new Date(year, 0);  // initializes date in year (year-01-01)
    let dateObj: Date = new Date(initDate.setDate(dayOfYear));
    return dateObj.toLocaleDateString();
  }

  sortByDate(dataByType: any) {

    let dateKeys = Object.keys(dataByType);
    let numDates = dateKeys.map(item => {
      let year = item.split(' ')[0];
      let day = item.split(' ')[1];

      if (day.length === 1) {
        day = "00" + day;
      }
      else if (day.length === 2) {
        day = "0" + day;
      }

      return parseInt(year + day);

    });

    let sortedDates = numDates.sort((a, b) => a - b);
    let sortedDateKeys = sortedDates.map(item => {
      return item.toString().slice(0, 4) + " " + item.toString().slice(4);
    });

    let orderedArrayOfObjects = [];

    // Creating array of objects so they're ordered when looped
    sortedDateKeys.forEach(sortedDate => {
      let day = parseInt(sortedDate.split(' ')[1]);  // removes leading zeros
      sortedDate = sortedDate.split(' ')[0] + ' ' + day;  // reformats sorted date
      for(let date in dataByType) {
        if (date === sortedDate) {
          let dataObj = {};
          dataObj[sortedDate] = dataByType[sortedDate];
          orderedArrayOfObjects.push(dataObj);
          break;
        }
      }
    });

    return orderedArrayOfObjects;
  
  }

}