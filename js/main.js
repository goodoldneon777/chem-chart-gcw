var mChemChart = {
	x: {
		title: 'Cast Date',
		format: '%m/%d/%Y'
	},
	y: {
		title: '',
		unit: '%'
	},
	maxRows: 20000
};
var mSQL = {};
var mChart = {};



$(document).ready( function() {
	'use strict';
	mChemChart.init();
});




mChemChart.init = function() {
	'use strict';
	mChemChart.errorFlag = false;


	var date30DaysAgo = moment().subtract(30, 'days').format('M/D/YY');
	$('#mOptions #sample input').val('26');
	$('#mOptions #start input').val(date30DaysAgo);
	$('#mOptions #round input').val('day');


	watch();


	function watch() {
		$('#generate').click( function() {
			mChemChart.toggleSubmitBtn('disable', 'Loading...');

			mChemChart.getFromDOM();


			if (mChemChart.errorFlag) {
				mChemChart.toggleSubmitBtn('enable');
				return false;
			}

			mChemChart.query = mChemChart.buildQuery(mChemChart);

			mChemChart.runQuery(mChemChart.query);
			

		});

	}
};











mChemChart.getFromDOM = function() {
	'use strict';
	var validFlag = null;
	var obj = {
		sample : nullIfBlank( $('#mOptions #sample input').val() ),
		elemField : nullIfBlank( $('#mOptions #elem option:selected').val() ),
		elem : nullIfBlank( $('#mOptions #elem option:selected').text() ),
		grade : nullIfBlank( $('#mOptions #grade input').val().toUpperCase() ),
		dataMin : nullIfBlank( $('#mOptions #dataRange .min').val() ),
		dataMax : nullIfBlank( $('#mOptions #dataRange .max').val() ),
		startDate : nullIfBlank( $('#mOptions #start input').val() ),
		endDate : nullIfBlank( $('#mOptions #end input').val() ),
		round : nullIfBlank( $('#mOptions #round input').val().toLowerCase() )
	};


	validFlag = mChemChart.validate(obj);

	if (validFlag) {
		mChemChart = $.extend(true, {}, mChemChart, obj);
	} else {
		return false;
	}


	return true;
};



mChemChart.validate = function(obj) {
	'use strict';
	var sample = obj.sample;
	var elem = obj.elem;
	var dataMin = obj.dataMin;
	var dataMax = obj.dataMax;
	var startDate = obj.startDate;
	var endDate = obj.endDate;
	var round = obj.round;
	var errorMsg = '';
	var date = '';
	var str = '';


	if (!sample) {
		errorMsg = 'ERROR:  \'Sample\' is missing. This field is required.';
		mChemChart.errorFunc(errorMsg);
		return false;
	} else {
		if (sample.toLowerCase() === 'final') {
			sample = 'Final';
		}
	}

	if ( (dataMin)  &&  (!$.isNumeric(dataMin)) ) {
		errorMsg = 'ERROR:  \'Data Minimum\' is not a valid number.';
		mChemChart.errorFunc(errorMsg);
		return false;
	}

	if ( (dataMax)  &&  (!$.isNumeric(dataMax)) ) {
		errorMsg = 'ERROR:  \'Data Maximum\' is not a valid number.';
		mChemChart.errorFunc(errorMsg);
		return false;
	}

	if (!startDate) {
		errorMsg = 'ERROR:  \'Start Date\' is missing. This field is required.';
		mChemChart.errorFunc(errorMsg);
		return false;
	} else if (startDate) {
		if ( !(startDate.substr(startDate.length - 4) > 2000) ) {
			str = startDate;
			obj.startDate = str.substr(0, str.length - 2) + '20' + str.substr(str.length - 2);
		}
	}

	if ( !isValidDate(startDate) ) {
		errorMsg = 'ERROR:  \'Start Date\' is not a valid date.';
		mChemChart.errorFunc(errorMsg);
		return false;
	}

	if ( (endDate)  &&  (!isValidDate(endDate)) ) {
		errorMsg = 'ERROR:  \'End Date\' is not a valid date.';
		mChemChart.errorFunc(errorMsg);
		return false;
	} else if (endDate) {
		if ( !(endDate.substr(endDate.length - 4) > 2000) ) {
			str = endDate;
			obj.endDate = str.substr(0, str.length - 2) + '20' + str.substr(str.length - 2);
		}
	}

	if ( (round)  &&  (round!=='day')  &&  (round!=='week')  &&  (round!=='month')  &&  (round!=='year') ) {
		errorMsg = 'ERROR:  \'End Date\' is not a valid date.';
		mChemChart.errorFunc(errorMsg);
		return false;
	} else if (round) {
		switch (round) {
			case 'day':
				obj.roundSQL = 'DD';
				break;
			case 'week':
				obj.roundSQL = 'WW';
				break;
			case 'month':
				obj.roundSQL = 'MM';
				break;
			case 'year':
				obj.roundSQL = 'YY';
				break;
			default:
				break;
		}
	}



	switch (elem) {
		case 'Mn':
			mChemChart.y.decimals = 2;
			mChemChart.y.format = '.2f';
			break;
		case 'N':
			mChemChart.y.decimals = 4;
			mChemChart.y.format = '.4f';
			break;
		case 'B':
			mChemChart.y.decimals = 4;
			mChemChart.y.format = '.4f';
			break;
		case 'CA':
			mChemChart.y.decimals = 4;
			mChemChart.y.format = '.4f';
			break;
		default:
			mChemChart.y.decimals = 3;
			mChemChart.y.format = '.3f';
			break;
	}


	mChemChart.y.title = sample + ' Test ' + elem;

	return true;
};



mChemChart.buildQuery = function(obj) {
	'use strict';
	var elemField = obj.elemField;
	var sample = obj.sample;
	var grade = obj.grade;
	var dataMin = obj.dataMin;
	var dataMax = obj.dataMax;
	var startDate = obj.startDate;
	var endDate = obj.endDate;
	var round = obj.roundSQL;
	var query = '';
	var roundX = '';
	var avgY = '';
	var avgYcount = '';
	var avgYstdev = '';
	var dateFilter = '';
	var sampleFilter = '';
	var gradeFilter = '';
	var yFilter = '';
	var realisticFilter = '';


	if (round) {
		roundX = 'trunc(TGC_CASTHEAT.START_HEAT_DTS, \'' + round + '\')';
		avgY = 'cast( avg(y) over(partition by roundX) as decimal(10, 4) )';
		avgYcount = 'count(y) over(partition by roundX)';
		avgYstdev = 'cast( stddev(y) over(partition by roundX) as decimal(10, 4) )';
	} else {
		roundX = 'null';
		avgY = 'null';
		avgYcount = 'null';
		avgYstdev = 'null';
	}


	dateFilter = buildDateFilter(startDate, endDate);
	sampleFilter = buildSampleFilter(sample);
	gradeFilter = buildGradeFilter(grade);
	yFilter = buildyFilter(dataMin, dataMax);
	realisticFilter = '    and TGC_CASTHEAT_CHEM.' + elemField + ' > 0 \n'


	query = 
		'select \n' +
		'  x, y, heat, grade, roundX, ' + avgY + ' as avgY, \n' +
		'  ' + avgYcount + ' as avgYcount, ' + avgYstdev + ' as avgYstdev \n' +
		'from( \n' +
		'  select \n' +
  	'    TGC_CASTHEAT.START_HEAT_DTS as x, \n' +
  	'    TGC_CASTHEAT_CHEM.' + elemField + ' as y, \n' +
  	'    TGC_CASTHEAT.HEAT_ID as heat, \n' +
  	'    TGC_CASTHEAT.FINAL_GRADE as grade, \n' +
  	'    ' + roundX + ' as roundX \n' +
		'  from AGC0001.TGC_CASTHEAT_CHEM TGC_CASTHEAT_CHEM \n' +
		'  inner join AGC0001.TGC_CASTHEAT TGC_CASTHEAT \n' +
  	'    on TGC_CASTHEAT_CHEM.CAST_HEAT_SEQ_ID = TGC_CASTHEAT.CAST_HEAT_SEQ_ID \n' +
		dateFilter +
  	sampleFilter +
  	gradeFilter +
  	yFilter +
  	realisticFilter +
  	') \n' +
		'where \n' +
		'  x is not null \n' +
		'  and y is not null \n' +
		'order by x asc \n';


	return query;


	function buildDateFilter(startDate, endDate) {
		var filter = '';
		if ( (startDate)  &&  (endDate) ) {
			filter = '  where TGC_CASTHEAT.START_HEAT_DTS between to_date(\'' + startDate + '\', \'mm/dd/yyyy\') and to_date(\'' + endDate + '\', \'mm/dd/yyyy\') \n';
		} else {
			filter = '  where TGC_CASTHEAT.START_HEAT_DTS >= to_date(\'' + startDate + '\', \'mm/dd/yyyy\') \n';
		}

		return filter;
	}

	function buildSampleFilter(sample) {
		var filter = '';
		if (sample.toLowerCase() === 'final') {
			filter = '    and TGC_CASTHEAT_CHEM.SAMPLE_ID in (\'56\', \'66\') \n';
		} else {
			filter = '    and TGC_CASTHEAT_CHEM.SAMPLE_ID = \'' + sample + '\' \n';
		}
		
		return filter;
	}

	function buildGradeFilter(grade) {
		var filter = '';
		if (grade) {
			filter = '    and TGC_CASTHEAT.FINAL_GRADE like \'' + grade + '\' \n';
		}
		
		return filter;
	}

	function buildyFilter(dataMin, dataMax) {
		var filter = '';
		var field = 'TGC_CASTHEAT_CHEM.' + elemField;
		if ( (dataMin)  &&  (dataMax) ) {
			filter = '    and ' + field + ' between \'' + dataMin + '\' and \'' + dataMax + '\' \n';
		} else if ( (dataMin) ) {
			filter = '    and ' + field + ' >= \'' + dataMin + '\' \n';
		} else if ( (dataMax) ) {
			filter = '    and ' + field + ' <= \'' + dataMax + '\' \n';
		}
		
		return filter;
	}
};



mChemChart.runQuery = function(query) {
	'use strict';
	var urlQuery = 'php/query_oci.php';
	var data = {};

	$.ajax({
		type: 'POST',
		url: urlQuery,
		data: {
			'sql' : JSON.stringify(query)
		},
		dataType: 'json',
		success: function(results) {
			if (results.length > mChemChart.maxRows) {
				alert(
					'Too many results. Please narrow your search. \n\n' +
					'Results: ' + results.length + ' heats \n' +
					'Max: ' + mChemChart.maxRows + ' heats \n'
				);
			}

			// console.log(results);
			// console.log(mChemChart.query);
			// console.log(mChemChart);

			mChemChart.data = mChemChart.parseData(results.data);

			mChemChart.updateChart(mChemChart);
	
			mChemChart.data = {};  // Reset.

			mChemChart.toggleSubmitBtn('enable');
		},
		error: function(results) {
			alert(
				'ERROR: AJAX/PHP/SQL issue. \n\n' +
				'This error probably isn\'t your fault. Please email a screenshot of this web page to Aaron Harper at amharper@uss.com.'
			);

			console.log(mChemChart.query);
			console.log(mChemChart);

			mChemChart.toggleSubmitBtn('enable');
	  }
	 });
};



mChemChart.parseData = function(arr) {
	var data = {
		heats: [],
		averages: []
	};
	var rowPrev = [];
	var x = '';
	var y = '';
	var heat = '';
	var grade = '';
	var roundX = '';
	var avgY = '';
	var avgYcount = '';
	var avgYstdev = '';


	$.each(arr, function( index, row ) {

		rowPrev = [];
		if (index > 0) {
			rowPrev = arr[index-1];
		}

		x = Date.parse(row[0]);
		// x = JSON.stringify(row[0]);
		y = parseFloat(row[1], 4);  //Fix Bug: Decimals showing as strings.
		heat = row[2];
		grade = row[3];
		roundX = Date.parse(row[4]);
		// roundX = JSON.stringify(row[0]);
		avgY = parseFloat(row[5], 4);  //Fix Bug: Decimals showing as strings.
		avgYcount = row[6];
		avgYstdev = parseFloat(row[7], 4);  //Fix Bug: Decimals showing as strings.

		data.heats.push( { x: x, y: y, heat: heat, grade: grade } );


		if (index == 0) {
			data.averages.push( { x: roundX, y: avgY, count: avgYcount, stdev: avgYstdev } );
		} else if ( (row[4] != rowPrev[4])  ||  (row[5] != rowPrev[5]) ) {
			data.averages.push( { x: roundX, y: avgY, count: avgYcount, stdev: avgYstdev } );
		}


	});


	return data;
};



mChemChart.updateChart = function(obj) {
	$(function () {
		$('#m-graph').highcharts({
			chart: {
				type: 'scatter',
				animation: false
			},
			title: {
				text: obj.y.title + ' vs ' + obj.x.title
			},
			xAxis: {
				type: 'datetime',
				dateTimeLabelFormats: { // don't display the dummy year
					month: '%e. %b',
					year: '%b'
				},
				title: {
					text: mChemChart.x.title
				},
				labels: {
		      format: '{value:' + mChemChart.x.format + '}'
			  }
			},
			yAxis: {
				title: {
					text: mChemChart.y.title
				},
				// min: mChemChart.y.min,
				// max: mChemChart.y.max,
				labels: {
		      format: '{value:' + mChemChart.y.format + '}'
			  }
			},
			tooltip: {
				snap: 1,
				headerFormat: '<b>{series.name}</b><br>',
				// pointFormat:
				// 	'y: {point.y:' + mChemChart.y.format + '} ' + mChemChart.y.unit + '<br>' +
				// 	'x: {point.x:' + mChemChart.x.format + '} ' + mChemChart.x.unit + '<br>' +
				// 	'Heat: {point.info}'
				formatter: function() {
					var text = 'y: ' + Highcharts.numberFormat(this.point.y, obj.y.decimals, '.', ',') + ' ' + obj.y.unit + '<br>';
					if (this.series.name == 'Heats') {
						text += 'x: ' + Highcharts.dateFormat(obj.x.format, this.point.x) + '<br>';
						text +=	'Heat: ' + this.point.heat + '<br>';
						text +=	'Grade: ' + this.point.grade;
					} else if (this.series.name.substring(0, 7) == 'Average') {
						text += 'x: ' + Highcharts.dateFormat(obj.x.format, this.point.x) + ' (rounded to ' + obj.round + ') <br>';
						text +=	'Heat Count: ' + this.point.count + ' <br>';
						text +=	'Std Dev: ' + Highcharts.numberFormat(this.point.stdev, obj.y.decimals + 1);
					}


					return text;
				}
			},

			plotOptions: {
				spline: {
					marker: {
						enabled: true
					}
				},
				series: {
					turboThreshold: mChemChart.maxRows
				}
			},
			line: {
				visible: false
			},

			series: [
				{
					name: 'Heats',
					color: 'rgba(79,129,189,0.4)',
					data: obj.data.heats,
					stickyTracking: false,
					regression: false,
					regressionSettings: {
						type: 'linear',
						color:  'rgba(0, 0, 0, 0.8)'
					}
				},
				{
					name: 'Average (rounded to ' + obj.round + ')',
					color: 'rgba(192,80,77,1.0)',
					marker: {
						radius: 8,
						symbol: 'circle'
					},
					data: obj.data.averages
				}
			]
		});
	});
};



mChemChart.toggleSubmitBtn = function(toggle, text) {
	'use strict';
	var defaultText = 'Generate Chart';
	if (text === undefined) {
		text = defaultText;
	}
	switch (toggle) {
		case 'disable':
			$('#mOptions #generate').prop('disabled', true);
			$('#mOptions #generate').val(text);
			break;
		case 'enable':
			$('#mOptions #generate').prop('disabled', false);
			$('#mOptions #generate').val(defaultText);
			break;
		default:
			break;
	}
	return true;
};




mChemChart.errorFunc = function(errorMsg) {
	'use strict';
	alert(errorMsg);
	mChemChart.errorFlag = true;
};




function nullIfBlank(val) {
	'use strict';
	if (val === '') {
		return null;
	} else {
		return val;
	}
}

function isValidDate(str) {
	'use strict';
	var date = new Date(str);
	var validFlag = moment(date).isValid();

	return validFlag
}