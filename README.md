<h3>The request body needs to have the following format:</h3>
<br>
<br>
{<br>
	"params":[<br>
  { "name": "useDataSince", "value": "2019-01" },<br>
  { "name": "holidaysInPredictedPeriod", "list": ""},<br>
  { "yearNo": 2019, "dayIndex": 109 },<br>
  { "yearNo": 2019, "dayIndex": 112 },<br>
  { "yearNo": 2020, "dayIndex": 101 },<br>
  { "yearNo": 2020, "dayIndex": 104 },<br>
  { "yearNo": 2021, "dayIndex": 92 },<br>
  { "yearNo": 2021, "dayIndex": 95 }<br>
],<br>
	"data": [<br>
  {<br>
    "timestamp": "2018-09-24T00:00:00.000Z",<br>
    "value": 43<br>
  },<br>
  {<br>
    "timestamp": "2018-10-01T00:00:00.000Z",<br>
    "value": 134<br>
  },<br>
  {.........},<br>
  ...<br>
]<br>
}<br>
<br>
<br>
The objects in params (from second index and further) are referencing the holidays whose dates change each year, so these have to be supplied in the request along with the data (if I know that I am supplying data from 2018-2020 for example, I have too find the dates of the non-static holiday in those years and supply them). These holidays are identified with the year number that they belong to and with the "dayIndex" which holds their position within that year (for example 100th day of that year).
