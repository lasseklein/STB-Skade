//Uses Handlebars

var scoreneedle = $("#needle");

class Measure {
	constructor (name, value, description) {
  	this.name = name;
    this.value = value;
    this.description = description;
  }
  selected = false;
  clone() {
    return new Measure(this.name, this.value, this.description);
  }
  toggle() {
    this.selected = !this.selected;
  }
}

class Room {
	constructor (name, measures) {
  	this.name = name;
     for(const measure of measures) {
       this.measures.push(measure.clone());
    }
   }
    measures = [];
}


class House {
	constructor (rooms, measures) {
  	this.rooms = rooms; 
    for(const measure of measures) {
      this.measures.push(measure.clone());
    }
  }
  rooms = [];
  measures = [];
  score = 0;
  maxscore = 0;
  scorepct = 0;
  removeRoom(roomnum){
    if(this.rooms.length > roomnum){
      this.rooms.splice(roomnum, 1);
      this.update;
    }
  }
  update() {
    var allmeasures = [];
    allmeasures = allmeasures.concat(this.measures);
    for(const room of this.rooms){
     allmeasures = allmeasures.concat(room.measures);
    }
    this.score = 0;
    this.maxscore = 0;
    for(const m of allmeasures){
      if(m.selected) this.score += m.value;
      this.maxscore += m.value;
    }

    this.scorepct = Math.round(100*this.score/this.maxscore);
    console.log('Score: '+this.score + ' of '+ this.maxscore + ' = '
                + this.scorepct +'%');
    updateScore(this.scorepct);
    this.serialize();
  }
  serialize() {
    localStorage.setItem('house', JSON.stringify(this));
  }
}

function updateScore(score) {
  var degrees = -70.0 + (score*1.4);
  scoreneedle.css({'transform' : 'rotate('+  degrees +'deg)'});
  oldscore = parseInt($('#scorevalue').html()); 
  scorecounter(oldscore,oldscore,score,$('#scorevalue') )
}

function handleEvent(e) {
  e.preventDefault();
  e.data.measure.toggle();
  if(e.data.measure.selected){
    $(this).addClass('selected');
  } else {
    $(this).removeClass('selected');
  }
  house.update();
}

function handleEvent2(e) {
  alert("jæ");
  console.log (e.target.getAttribute("data-measure") );
}

var house;

$( document ).ready(function() {

  var vannstopper       = new Measure('Vannstopper', 100, 'Stopper vannet');
  var alarm             = new Measure('Alarm', 50, 'Om alarm');
  var automatsikringer  = new Measure('Automatsikringer', 75, '');
  var ror               = new Measure('Rør-i-rør', 50, '');
  var lekkasjesensor    = new Measure('Lekkasjesensor', 25, '');
  var brannvarsler      = new Measure('Røykvarsler', 20, '');
  var fuktsensor        = new Measure('Fuktsensor', 60, '');
  
  var rooms = {
    livingroom : new Room('Stue',    [brannvarsler]),
    kitchen    : new Room('Kjøkken', [brannvarsler, lekkasjesensor]),
    bathroom   : new Room('Bad',     [brannvarsler, lekkasjesensor]),
    bedroom    : new Room('Soverom', [brannvarsler, lekkasjesensor]),
    cellar     : new Room('Kjeller', [brannvarsler, fuktsensor])
  }

  house = new House(Object.values(rooms), [vannstopper,alarm,automatsikringer,ror]);
  house.update();

 var t = `
  <div class='housemeasures'>
  {{#measures}}
    <div class='measure' data-measure='{{@index}}'>{{name}}</div>
  {{/measures}}
  </div>

  <div class='rooms'>
  {{#rooms}}
    <div class='room' data-room='{{@index}}'>
      <div class='roomname'>{{name}}</div>
      {{#measures}}
        <div class='measure{{#selected}} selected{{/selected}}' data-room='{{@../index}}' data-measure='{{@index}}' href='#'>{{name}}</div>
      {{/measures}}
    </div>
  {{/rooms}}
  </div>
`;

  /*var template = Handlebars.compile(t);
  const househtml = template(house);
  console.log(househtml); //*/
  var root = $('#house');
  //root.append(househtml);

  var housemeasures = $("<div class='housemeasures'></div>");
  root.append(housemeasures);
  var m = 0;
  for(const measure of house.measures) {
    $("<div class='measure' data-measure='"+ m++ +"' id='"+measure.name+"'>"+measure.name+"</div>")
      .appendTo(housemeasures);
    $('#'+measure.name).on('click',{'measure': measure}, handleEvent); 
  };
  
  var rooms = $("<div class='rooms'></div>");
  root.append(rooms);
  var roomnum = 0;
  for(const room of house.rooms) {
    var roomdiv = $("<div class='room' data-room='"+roomnum+"' id='"+roomnum+"'></div>");
    rooms.append(roomdiv);
    roomdiv.append($("<div class='roomname'>"+room.name+"</div>"));
    for(const measure of room.measures) {
      var id = room.name+measure.name;
      roomdiv.append($("<div class='measure"+((measure.selected)?' selected':'')+"' id='"+id+"' href='#'>"+measure.name+"</div>"));
      $('#'+id).on('click',{'measure': measure}, handleEvent ); 
    } 
    roomnum++;
  }
//*/
});

$('.measure').on('click',handleEvent2); 


function scorecounter(start,current,target,element) {
  const duration = 250;
  var dir = (target>start)?1:-1;
  var diff = dir*(target-start);
  var speed = duration/diff;

  var step = dir*Math.trunc((target-start) / speed);
  step = (step<1)?1:step;
  current += dir*step;
  if (dir*(target-current)>0) {
    element.html(current);
    setTimeout(scorecounter, speed, start,current,target,element);
  } else {
    element.html(target);
  }
}