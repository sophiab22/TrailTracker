main.controller('locationController', function($scope, $routeParams, dataProvider){
  dataProvider.getData(function(err, data){
      if(!err){
        scope.data = data;
    	}
    });
});