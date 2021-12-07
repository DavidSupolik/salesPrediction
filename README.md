<h5>Request Body needs to have the following format:</h5>

{

	"params":[
  { "name": "useDataSince", "value": "2019-01" },
  { "name": "holidaysInPredictedPeriod", "list": ""},
  { "yearNo": 2019, "dayIndex": 109 },
  { "yearNo": 2019, "dayIndex": 112 },
  { "yearNo": 2020, "dayIndex": 101 },
  { "yearNo": 2020, "dayIndex": 104 },
  { "yearNo": 2021, "dayIndex": 92 },
  { "yearNo": 2021, "dayIndex": 95 }
],
	"data": [
  {
    "timestamp": "2018-09-24T00:00:00.000Z",
    "value": 43
  },
  {
    "timestamp": "2018-10-01T00:00:00.000Z",
    "value": 134
  },
  {
  ...
  },
  ...
]
}

The objects in params (from second index and further) are referencing the holidays whose dates change each year, so these have to be supplied in the request along with the data (if I know that I am supplying data from 2018-2020 for example, I have too find the dates of the non-static holiday in those years and supply them). These holidays are identified with the year number that they belong to and with the "dayIndex" holds their number within that year (for example 100th day of that year)
