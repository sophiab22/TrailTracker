/* ================================================================
                  storing data based on person
==================================================================*/
var dbName = 'ProfileData7';
var myData;
var trail;
main.name = "default";
 
 //open database
sklad.open(dbName, {
  version: 1,
  migration: {
    '1': function(database){
      var objStore = database.createObjectStore('profileData', {
        autoIncrement: true, 
        keyPath: 'timestamp'
      });
      objStore.createIndex('description_search', 'trail', {unique: false});
      objStore.createIndex('timestamp_search', 'timestamp', {unique: false});
      objStore.createIndex('the_name', 'name', {unique: false});
      objStore.createIndex('done', 'done', {unique: false});

      var nameStore = database.createObjectStore('nameData', {
        autoIncrement: true, 
        keyPath: 'name'
      });
      nameStore.createIndex('using', 'using', {unique: false});
      nameStore.createIndex('name_search', 'name', {unique: true});
    }
  }
}, function (err, conn) {
  if (err) { 
    throw err; 
  }
  $(function () {
    var $trail       = $('#trail'),
        $name        = $('#name'),
        $add         = $('#add'),
        $add_name    = $('#add-name'),
        $list        = $('.list-of-trails'),
        $clear       = $('.clear-history'),
        $nameTitle   = $("#menu .profile #existing-name h1"),
        $startPage   = $("#start-page"),
        $showName    = $('#show-the-name'),
        $ok          = $('.ok'),
        $logout      = $(".logout");

    function setStart(bool){
      if(bool == true){
        $nameTitle.addClass("hidden");
        $startPage.removeClass("hidden");
      }else{
        $nameTitle.text(main.name);
        $nameTitle.removeClass("hidden");
        $startPage.addClass("hidden");
      }
    }

    function findName(conn) {
      conn
          .get({
            nameData:{description: sklad.DESC, index: 'name_search'}
          }, function(err, data) {
            if (err) { return console.error(err); }

            var hasName = false;
            data.nameData.forEach(function(theName){
              if(theName.value.using){
                main.name = theName.value.name;
                hasName = true;
                return;
              }
            });

            if( hasName == false ){
              $showName.text("First time? Please pick a Username");
            }else{
              $showName.text("The last user was "+ main.name + ". Is that you?");
            }
          });
    }

    var notUsingNames = function(conn) {
      // stop all other names from being used at this time
      conn
          .get({
            nameData:{description: sklad.DESC, index: 'name_search'}
          }, function(err, data) {
            if (err) { return console.error(err); }

            var hasName = false;
            data.nameData.forEach(function(theName){
              theName.value.using = false;
              conn.upsert('nameData', theName.value, function(err){
                    if(err){ return console.error(); }
              });
            });
          });
    };

    $add_name.click(function(){
      if (!$name.val().trim() || $name.val().trim() == "default") { return; } //nothing there then do nothing

      var thisData = {
        nameData: [
          { 
            timestamp: Date.now(),
            name: $name.val().trim(),
            using: true
          }
        ]
      };

      notUsingNames(conn);
      conn.insert(thisData, function (err, insertedKeys) {
        if (err) { 
          if(err.message == "Key already exists in the object store."){ //already have this person :)
            conn.upsert('nameData', thisData.nameData, function(err){ //replace the data for the name 
                    if(err){ return console.error(); }
                    $showName.text("Welcome back " + main.name + "!");
                  });
          }else{ return console.error(err); } //if the error is not bc 2 same names then return
        }
        main.name = $name.val().trim();
        $showName.text("Hello " + main.name + ". Welcome to our app!");
        $name.val('');
        updateRows(conn);
      })
    });
 
    function updateRows(conn) {
      ///UPDATE DATA
      conn
        .get({
          profileData: {description: sklad.DESC, index: 'timestamp_search'} //gets only the components with the right name
        }, function (err, data) {
          if (err) { 
            return console.error(err); 
          }else{
            myData = data; // now contains profileData
        }

        ///UPDATE VISUALS
          $list.empty(); //make the list varaible have no variables because you will fill it
              
          myData.profileData.forEach(function(data){ //for each in to do list add text to the element
              if(data.value.name == main.name){ //if you have the right name
                var $li = $(document.createElement('li'));
                if(data.value.done){
                  $li.css({'text-decoration' : 'line-through'})
                }
                else{
                  $li.css({'text-decoration' : 'none'})
                }

                $li.text("trail name :" + data.value.trail);

                $li.click(function(){
                  data.value.done = !data.value.done; //makes variable done the opposite.
                  //then change the value of done in the conn
                  conn.upsert('profileData', data.value, function(err){
                    if(err){ return console.error(); }
                    updateRows(conn); 
                  });
                });
                $list.append($li); //
              }
          });
        });
    }

    $clear.click(function(){
      conn.clear(['profileData', 'nameData'], function (err) {
            if (err) {
                throw new Error(err.message);
            }
      });
      $showName.text("Everything is gone!");
      main.name = "default";
      updateRows(conn);
    });

    $add.click(function(){
      if (!$trail.val().trim()) { return; } //nothing there then do nothing
      main.addTrail($trail.val().trim());
      $trail.val("");
    });

    $ok.click(function(){
      if(main.name != "default"){
        setStart(false);
        setTimeout(function(){
            $showName.text("You are " + main.name + "...right?");
        }, 150);
      }else{
        $showName.text("Please choose a Username!");
      }
    });

    main.addTrail = function (theTrail) {
      // this method is called from the trail controller when the check button is pressed
      var thisData = {
        profileData: [
          { 
            timestamp: Date.now(),
            trail: theTrail,
            done:false,
            name: main.name
          }
        ]
      };

      trail = thisData.profileData;

      conn.insert(thisData, function (err, insertedKeys) {
        if (err) { return console.error(err); }
        updateRows(conn);
      })
    };

    $logout.click(function(){
        $startPage.removeClass("hidden");
    });

    //init
    findName(conn);
    updateRows(conn);
  });
});