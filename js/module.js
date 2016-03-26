var app = angular.module('app', ['fcsa-number']);
app.config(['$controllerProvider', function($controllerProvider) {
  $controllerProvider.allowGlobals();
}]);

app.controller('inputData', function($scope) {
  // default field values 
  $scope.mortageAmount = 200000;
  $scope.interestRate = 2.99;
  $scope.interestTerm = 25;
  $scope.actualInterestRate = 0;
  $scope.paymentFrequency = "0";
  $scope.disable = 'btn-default disabled';
  $scope.formErrorName = [{
    name: "Mortage Amount has to be an integer between 1000 and 3,000,000",
    tag: null
  }, {
    name: "Interest Term has to be an integer between 5 and 30",
    tag: null
  }, {
    name: "Interest Rate has to greater than 0",
    tag: null
  }];
  $scope.formErrorActive = [];
  $scope.formError = false;
  $scope.paymentMethods = [{
    period: "Monthy",
    term: 12,
    paymentAmount: 0,
    paymentInterest: 0,
    actualAmorization: [0,0],
    Styleclass: null
  }, {
    period: "Weekly",
    term: 52,
    paymentAmount: 0,
    paymentInterest: 0,
    actualAmorization: [0,0],
    Styleclass: null
  }, {
    period: "Bi-Weekly",
    term: 26,
    paymentAmount: 0,
    paymentInterest: 0,
    actualAmorization: [0,0],
    Styleclass: null
  }];
  // validating input  
  $scope.validate = function() {
      $scope.formErrorActive = [];
      $scope.formError = false;
      $scope.formErrorName[0].tag = $scope.formErrorName[1].tag = $scope.formErrorName[2].tag = null;
      if (!($scope.mortageAmount % 1 == 0) ||  $scope.mortageAmount > 3000000 || $scope.mortageAmount < 1000) {
        errorEvent(0);
      }
      if (!($scope.interestTerm % 1 == 0) || $scope.interestTerm > 30 || $scope.interestTerm < 5 ) {
        errorEvent(1);
      }
      if ($scope.interestRate <= 0) {
        errorEvent(2);
      }
      if (!$scope.formError) {
        $scope.tab = 2;
        $scope.graph = 'btn-primary';
        $scope.table = 'btn-default';
        $scope.mortageAmountClass = $scope.interestRateClass = $scope.interestTermClass = "";
        paymentInterestAmount();
      }
    }
  //displayes error on screen
  errorEvent = function(code) {
    $scope.formErrorName[code].tag = "input-error";
    $scope.formError = true;
    $scope.formErrorActive.push($scope.formErrorName[code].name);
  }

  paymentInterestAmount = function() {
    $scope.paymentMethods[0].Styleclass = $scope.paymentMethods[1].Styleclass = $scope.paymentMethods[2].Styleclass = null;
    $scope.frequency = $scope.paymentMethods[$scope.paymentFrequency].period;
    $scope.paymentMethods[$scope.paymentFrequency].Styleclass = 'bold';
    // convert to semi-annually 
    $scope.actualInterestRate = Math.pow((1 + $scope.interestRate / 200),2) - 1;
    // calculate monthly payment
    var totalTerm = $scope.paymentMethods[0].term * $scope.interestTerm;
    var eqInterestRate = Math.pow((1 + $scope.actualInterestRate), (1 / $scope.paymentMethods[0].term)) - 1;
    var payment = ($scope.mortageAmount * eqInterestRate) / (1 - Math.pow((1 + eqInterestRate), -totalTerm));
    $scope.paymentMethods[0].paymentAmount = payment;
    $scope.paymentMethods[0].paymentInterest = payment * totalTerm - $scope.mortageAmount;
    $scope.paymentMethods[0].actualAmorization[0] = $scope.interestTerm;
    //weekly and bi-weekly payment
    for(var i = 1; i < 3; i++){
      $scope.paymentMethods[i].paymentAmount = payment / (4 / i);
      var EqInterestRate = Math.pow((1 + $scope.actualInterestRate), (1 / $scope.paymentMethods[i].term)) - 1;
      var TotalTerm = (Math.log((($scope.mortageAmount * EqInterestRate) / ($scope.paymentMethods[i].paymentAmount) - 1) * -1) /  Math.log(1 + EqInterestRate)) * -1;
      $scope.paymentMethods[i].paymentInterest = $scope.paymentMethods[i].paymentAmount * TotalTerm - $scope.mortageAmount;
      $scope.paymentMethods[i].actualAmorization[0] = Math.floor(TotalTerm / $scope.paymentMethods[i].term);
      $scope.paymentMethods[i].actualAmorization[1] = Math.ceil((TotalTerm / $scope.paymentMethods[i].term - $scope.paymentMethods[i].actualAmorization[0]) * 12);    
    }
    amortizationTableGenerator();
    graphData();
  };

  amortizationTableGenerator = function() {
    $scope.calculated = true;
    var tpayment = $scope.paymentMethods[$scope.paymentFrequency].term * $scope.interestTerm;
    // object for every row on amotization table
    var info = {
      payment: 0,
      paymentAmount: $scope.paymentMethods[$scope.paymentFrequency].paymentAmount,
      interestAmount: 0,
      principal: 0,
      moneyRemaining: $scope.mortageAmount,
      interestRate: Math.pow(1 + $scope.actualInterestRate, 1 / $scope.paymentMethods[$scope.paymentFrequency].term) - 1
    };
    // creating data for amortization table
    var data = []
    while (info.moneyRemaining) {
      
      info.payment += 1;
      info.interestAmount = info.moneyRemaining * info.interestRate;
      if(info.moneyRemaining - info.paymentAmount < 0){
         info.paymentAmount = info.moneyRemaining;
         info.principal = info.paymentAmount - info.interestAmount;
         info.moneyRemaining = 0;
      }else{
         info.principal = info.paymentAmount - info.interestAmount;
         info.moneyRemaining -= info.principal;
     }

      value = {}
      value.payment = info.payment;
      value.paymentAmount = info.paymentAmount;
      value.interestAmount = info.interestAmount;
      value.principal = info.principal;
      value.moneyRemaining = info.moneyRemaining;
      data.push(value);
    }    
    $scope.amortizationTableData = data;
  };

  // drawing graph on canvas
  graphData = function() {
    if ($scope.barChart) $scope.barChart.destroy();
    var x_labels = [];
    var amotization = [];
    // computing data for graph 
    for (var i = 1; $scope.interestTerm >= i; i++) {
      x_labels.push(i);
      var term = $scope.paymentMethods[$scope.paymentFrequency].term;
      var eqInterestRate = Math.pow((1 + $scope.actualInterestRate), (1 / term)) - 1; 
      var principal = $scope.mortageAmount * Math.pow(1 + eqInterestRate, i * term);
      var payment = $scope.paymentMethods[$scope.paymentFrequency].paymentAmount * ((Math.pow(1 + eqInterestRate, i * term) - 1) / eqInterestRate);
      var outstanding = principal - payment;
      if(outstanding < 0) break;
      amotization.push(Math.round(outstanding * 100) / 100);
    }
    var barData = {
      labels: x_labels,
      datasets: [{
        label: "a",
        fillColor: "#337ab7",
        strokeColor: "#327292",
        data: amotization
      }]
    }
    var options = {
      animation: true,
      scaleLabel: function(label) {
        return ' $' + label.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
    };
    var income = document.getElementById("income").getContext("2d");
    $scope.barChart = new Chart(income).Bar(barData, options);
  }
})