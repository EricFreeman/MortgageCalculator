$(function() {
	var loanAmount, loanLength, interestRate, monthlyPayment, 
		extraMonthly, startDate, isBiMonthly, periodInterestRate, oneOffCount = 0;
		
	populateStartYear();
	applyMoneyBind();
	
	//default value of text boxes to $0.00 so code won't break when they're empty
	function applyMoneyBind() {
		$('input[type="text"]').focusout(function() {
			if(this.value=='')
				this.value = toMoney(0);
			else if($(this).hasClass('money'))
				this.value = toMoney(fromMoney(this.value));
		});
	}
	
	//get new value of fields
	$('#recalculate').click(function() {
		loanAmount = fromMoney($('#loanAmount').val());
		loanLength = $('#loanLength').val();
		interestRate = $('#interestRate').val();
		monthlyPayment = fromMoney($('#monthlyPayment').val());
		extraMonthly = fromMoney($('#extraMonthly').val());
		isBiMonthly = $('#isBiMonthly').prop('checked');

		periodInterestRate = interestRate / 12 / 100;
		var payment = round(loanAmount * (periodInterestRate * Math.pow(1 + periodInterestRate, loanLength)) / (Math.pow(1 + periodInterestRate, loanLength) - 1));
		monthlyPayment = payment;
		if(isBiMonthly) monthlyPayment /= 2;

		var startMonth = $('#startDateMonth').val();
		var startYear = $('#startDateYear').val();
		startDate = new Date(startMonth + '/1/' + startYear);
		
		calculateTable();
		
		$('#loanAmount').val(toMoney(fromMoney($('#loanAmount').val())));
		$('#monthlyPayment').val(toMoney(fromMoney($('#monthlyPayment').val())));
		$('#extraMonthly').val(toMoney(fromMoney($('#extraMonthly').val())));
	});
	
	//rounds to two decimal points and the .000001 fixes 1.005 not rounding to 1.01
	function round(inp) {
		var num = parseFloat(inp);
		return Math.round((num + 0.00001) * 100) / 100
	}
	
	//calculate new 
	function calculateTable() {
		var balance = round(loanAmount),
			interestPaidAllTime = 0.0,
			monthlyInterest = 0.0,
			table = "<table><tr><td>Payment #</td><td>Date Paid</td><td>Balance</td><td>Towards Principal</td><td>Towards Interest</td><td>Total Interest Paid</td></tr>",
			lastMonth, currMonth,
			towardsPrincipal,
			towardsInterest,
			paymentNum = 1,
			lastMonthBalance = round(loanAmount);
			
		extraMonthly = round(extraMonthly);
		monthlyPayment = round(monthlyPayment);
		
		//clear out previous table
		$("#here_table").html("");
		
		while(balance > 0) {
			monthlyInterest = getInterestPayment(balance);
			
			//only the portion of your payment that doesn't go to interest goes to your principal
			balance = round(balance - monthlyPayment - extraMonthly);
			
			if(lastMonth != startDate.getMonth()) {
				balance = round(balance + monthlyInterest);
				towardsPrincipal = round(monthlyPayment + extraMonthly - monthlyInterest);
				towardsInterest = round(monthlyInterest);
				interestPaidAllTime = round(interestPaidAllTime + monthlyInterest);
				
				//improper inputs causing the balance to go up instead of down
				if(balance > lastMonthBalance) {
					balance = 0;
					table += "<tr><td colspan='6'><span class='bold'>IMPROPER INPUTS</span></td></tr>";
				}
			}
			else {
				//if it's still the previous month, don't add in interest again (for bi-weekly payments)
				towardsPrincipal = round(monthlyPayment + extraMonthly);
				towardsInterest = 0;
			}
			
			//if your final payments goes under balance, then take that part out of the payment and reset balance to 0
			if(balance < 0) {
				towardsPrincipal = round(towardsPrincipal - Math.abs(balance));
				balance = 0;
			}
			
			//add the row to the table
			table += createRow(paymentNum, startDate, balance, towardsPrincipal, towardsInterest, interestPaidAllTime);
			
			//increment the date by 1 month or 14 days depending on payment schedule
			lastMonth = startDate.getMonth();
			if(isBiMonthly) {
				var newEnd = new Date(startDate.getTime());
				newEnd.setDate(startDate.getDate() + 14);
				var extra = checkExtraPayment(startDate, newEnd);
				if(extra > 0) {
					paymentNum++;
					balance = round(balance - extra);
					table += createRow(paymentNum, startDate, balance, extra, 0, interestPaidAllTime);
				}
				
				startDate.setDate(startDate.getDate() + 14);
			}
			else {
				var newEnd = new Date(startDate.getTime());
				newEnd.setMonth(startDate.getMonth() + 1);
				var extra = checkExtraPayment(startDate, newEnd);
				if(extra > 0) {
					paymentNum++;
					balance = round(balance - extra);
					table += createRow(paymentNum, startDate, balance, extra, 0, interestPaidAllTime);
				}
				
				startDate.setMonth(startDate.getMonth() + 1);
			}
				
			paymentNum++;
		}
		
		table += "</table>";
		
		$('#here_table').append(table);
	}
	
	function checkExtraPayment(startDate, endDate) {
		var sum = 0, date, year, lookDate;
		for(var i = 1; i <= oneOffCount; i++) {
			//any dates between mean do extra payment straight to principal here
			date = $('.oneoffDate' + i).val();
			year = $('.oneoffYear' + i).val();
			lookDate = new Date(date  + '/' + '1/' + year);
			
			if(startDate <= lookDate && lookDate < endDate) {
				sum += fromMoney($('#oneoff' + i).val());
			}
		}
		
		return sum;
	}
	
	//populate the combobox for start year
	function populateStartYear() {
		var d = new Date(),
			combo = $('.year').each(function() {
				$(this).html('');
				for(var i = d.getFullYear(); i >= d.getFullYear() - 30; i--) {
					$(this).append("<option value='" + i + "'>" + i + "</option>");
				}
			})
			
			combo = $('.paymentYear').each(function() {
				$(this).html('');
				for(var i = d.getFullYear() + 30; i >= d.getFullYear() - 30; i--) {
					$(this).append("<option value='" + i + "'>" + i + "</option>");
				}
				$(this).val(d.getFullYear());
			})
	}
	
	//get the part of payment that goes towards interest
	function getInterestPayment(balance) {
		// blance * interestRate / months in year
		return round(balance * (interestRate / 100) / 12);
	}
	
	//create a new row in the table using the parameters
	function createRow(paymentNum, startDate, balance, towardsPrincipal, towardsInterest, interestPaidAllTime) {
		var row = "";
		
		row += "<tr>";
		row += "<td>" + paymentNum + "</td>";
		row += "<td>" + (startDate.getMonth() + 1) + "/" + startDate.getDate() + "/" + startDate.getFullYear() + "</td>";
		row += "<td>" + toMoney(balance) + "</td>";
		row += "<td>" + toMoney(towardsPrincipal) + "</td>";
		row += "<td>" + toMoney(towardsInterest) + "</td>";
		row += "<td>" + toMoney(interestPaidAllTime) + "</td>";
		row += "</tr>";
		
		return row;
	}
	
	//format the passed in float as money
	function toMoney(num) {
		var numStart = 1;
		num = "$" + num;
		if(num.indexOf('.') < 0)
			num = num + ".00";
		else if(/\.\d$/.test(num))
			num += "0";
			
		//fix bug where it was putting comma if number was negative because it started with two chatacters ($-)
		if (num.substr(0, 2) == '$-') numStart = 2;
		
		//format the number with commas
		for(var i = num.indexOf('.') - 3; i > numStart; i=i-3) {
			num = num.substr(0, i) + ',' + num.substr(i, num.length);
		}
		
		return num;
	}
	
	//take a string formatted as money and turn it into a float
	function fromMoney(num) {
		return parseFloat(num.replace('$', '').replace(',', ''));
	}
	
	//create new box for one off payments every time you click the plus sign
	$('#addMoreOneOff').click(function(d) {
		oneOffCount++;
		$('#oneOffContainer').append("<div id='oneOffContainer" + oneOffCount + "'><input type='text' class='money' id='oneoff" + oneOffCount + "' value='$0.00' /><select class='oneoffDate" + oneOffCount + "'><option value='1'>1 - January</option><option value='2'>2 - Febuary</option><option value='3'>3 - March</option><option value='4'>4 - April</option><option value='5'>5 - May</option><option value='6'>6 - June</option><option value='7'>7 - July</option><option value='8'>8 - August</option><option value='9'>9 - September</option><option value='10'>10 - October</option><option value='11'>11 - November</option><option value='12'>12 - December</option></select><select class='oneoffYear" + oneOffCount + " paymentYear'></select><input type='button' id='removeOneOff" + oneOffCount + "' value='-' /></div>");
		populateStartYear();
		applyMoneyBind();
		$('#removeOneOff' + oneOffCount).click(function() {
			$(this).parent().remove();
		});
	});
});