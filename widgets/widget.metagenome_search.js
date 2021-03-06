(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Search Widget",
                name: "metagenome_search",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table") ];
    };
    
    widget.query = "";
    widget.sort = "name";
    widget.sortDir = "asc";
    widget.offset = 0;
    widget.limit = 20;
    widget.match = "all";
    widget.advancedOptions = {};
    widget.specialKeyMapping = { "created": "creation date",
				 "name": "metagenome name",
				 "seq_method": "sequencing method",
				 "job": "job id",
				 "id": "metagenome id" };
    widget.keylist = [ { "name": "Project",
			 "items": [ { "name": "PI_firstname", "value": "PI firstname" },
				    { "name": "PI_lastname", "value": "PI lastname" },
				    { "name": "project_name", "value": "project name" },
				    { "name": "library_name", "value": "library name" },
				    { "name": "sample_name", "value": "sample name" },
				    { "name": "created", "value": "creation date" },
				    { "name": "name", "value": "metagenome name" },
				    { "name": "sequence_type", "value": "sequence type" },
				    { "name": "seq_method", "value": "sequencing method" } ] },
		       { "name": "Environment",
			 "items": [ { "name": "feature", "value": "feature" },
				    { "name": "material", "value": "material" },
				    { "name": "biome", "value": "biome" },
				    { "name": "env_package_name", "value": "env package name" },
				    { "name": "env_package_type", "value": "env package type" },
				    { "name": "latitude", "value": "latitude" },
				    { "name": "longitude", "value": "longitude" },
				    { "name": "location", "value": "location" },
				    { "name": "country", "value": "country" },
				    { "name": "collection_date", "value": "collection date" } ] },
		       { "name": "IDs",
			 "items": [ { "name": "job", "value": "job id" },
				    { "name": "project_id", "value": "project id" },
				    { "name": "sample_id", "value": "sample id" },
				    { "name": "library_id", "value": "library id" },
				    { "name": "id", "value": "metagenome id" },
				    { "name": "version", "value": "version" } ] },
		     ];
    
    widget.display = function (params) {
        var widget = Retina.WidgetInstances.metagenome_search[1];
	
	if (params && params.main) {
	    widget.main = params.main;
	    widget.sidebar = params.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;

	jQuery.extend(widget, params);
	
	// set the output area
	// search field
	var html = "\
<div>\
  <div style='margin-top: -5px; width: 300px; float: left;'>\
    <div class='input-append'>\
      <input type='text' id='searchtext' style='border-radius: 15px 0 0 15px;' placeholder='enter search term'>\
      <button class='btn' onclick='Retina.WidgetInstances.metagenome_search[1].queryAPI();' style='border-radius: 0 15px 15px 0;'>search</button>\
    </div>\
  </div>";

	// option buttons
	html += "\
  <div style='width: 175px; float: left;'>\
    <div class='btn-group' data-toggle='buttons-radio'>\
      <button class='btn btn-mini active' data-toggle='button' id='metadata_button'>metadata</button>\
      <button class='btn btn-mini' data-toggle='button' id='function_button'>function</button>\
      <button class='btn btn-mini' data-toggle='button' id='organism_button'>organism</button>\
    </div>\
  </div>";

	// result text
	html += "\
  <div style='font-size: 12px; float: left;' id='result_text'></div>\
</div>";

	// result section
	html += "<div id='result' style='overflow-x: scroll; clear: both;'></div>";

	content.innerHTML = html;

	document.getElementById('searchtext').addEventListener('keypress', function (event) {
	    event = event || window.event;
	    
	    if (event.keyCode == 13) {
		Retina.WidgetInstances.metagenome_search[1].queryAPI();
	    }
	});

	// create the sidebar
	var html_sidebar = '\
<style>\
  .control-label {\
  float: left;\
  position: relative;\
  top: 4px;\
  width: 50px;\
  font-weight: bold;\
  }\
</style>\
<h3 style="margin-left: 10px;">\
  <img style="height: 20px; position: relative; bottom: 4px; margin-right: 10px;" src="Retina/images/search.png">\
  Advanced Search\
</h3>\
<div id="advanced_div" style="margin-left: 10px; margin-right: 10px;">\
  <p>Add a search term for a specific metadata field to refine your search. You can use the asterisk (*) symbol as a wildcard.</p>\
  <div class="control-group">\
    <label class="control-label" for="advanced_search_key">field</label>\
    <div class="controls">\
      <select id="advanced_search_key" style="width: 270px;"></select>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="advanced_search_value">term</label>\
    <div class="controls input-append">\
      <input type="text" id="advanced_search_value" placeholder="enter searchterm">\
      <button class="btn" onclick="Retina.WidgetInstances.metagenome_search[1].refineSearch(\'add\');">add</button>\
    </div>\
  </div>\
  <div id="refine_search_terms"></div>\
</div>\
<hr style="margin-left: 10px; margin-right: 10px; clear: both; position: relative; top: 15px;">\
<h3 style="margin-left: 10px;">\
  <img style="height: 20px; position: relative; bottom: 4px; margin-right: 10px;" src="Retina/images/cart.png">\
  Saved Searches <sup style="color: gray; cursor: help;" id="storedresults">[?]</sup>\
</h3>\
<div id="storedresults_div" style="margin-left: 10px; margin-right: 10px;">\
'+(stm.user ? '<p>you have no previous searches</p>' : '<p>you must be logged in to view stored searches</p>')+'\
</div>\
<hr style="margin-left: 10px; margin-right: 10px; clear: both; position: relative; top: 15px;">\
<h3 style="margin-left: 10px;">\
  <img style="height: 20px; position: relative; bottom: 4px; margin-right: 10px;" src="Retina/images/disk.png">\
  Save Search <sup style="color: gray; cursor: help;" id="storeresults">[?]</sup>\
</h3>\
<div id="storeresults_div" style="margin-left: 10px; margin-right: 10px;">\
  <p>Store the parameters of your search query.</p>\
  <div class="control-group">\
    <label class="control-label" for="searchresult_name">name</label>\
    <div class="controls">\
      <input type="text" id="searchresult_name" style="width: 270px;" placeholder="enter name">\
    </div>\
  </div>\
  <label><b>description</b></label>\
  <div class="control-group">\
    <div class="controls">\
      <textarea id="searchresult_description" placeholder="enter description (optional)" style="width: 320px;" rows=3></textarea>\
    </div>\
  </div>\
  <button class="btn pull-right" type="button" id="storeSearchButton" onclick="Retina.WidgetInstances.metagenome_search[1].storeSearch();">store</button>\
  <div id="search_result_overview"></div>\
</div>\
';
	
	sidebar.innerHTML = html_sidebar;

	// check for search preferences
	if (stm.user) {
	    stm.loadPreferences().then(function(){ Retina.WidgetInstances.metagenome_search[1].updateStoredSearches(); });
	}

	jQuery("#storeresults").popover({ trigger: "hover", html: true, content: "<p style='font-weight: normal; line-height: 20px; font-size: 14px; margin-bottom: 0px;'>Saving a search requires you to be logged in.<br><br>You must also choose at least one search parameter.</p>"});
	jQuery("#storedresults").popover({ trigger: "hover", html: true, content: "<p style='font-weight: normal; line-height: 20px; font-size: 14px; margin-bottom: 0px;'>Click on the name of a previously stored search to apply the same search parameters again.</p>"});

	var keyselect = document.getElementById('advanced_search_key');
	var keylist = widget.keylist;
	document.getElementById('advanced_search_value').addEventListener('keypress', function (e) {
	    e = e || window.event;
	    if (e.keyCode == 13) {
		Retina.WidgetInstances.metagenome_search[1].refineSearch('add');
	    }
	});
	
	var keyselect_html = "";
	for (var i=0; i<keylist.length; i++) {
	    keyselect_html += "<optgroup label='"+keylist[i].name+"'>"
	    for (var h=0; h<keylist[i].items.length; h++) {
		keyselect_html += "<option value='"+keylist[i].items[h].name+"'>"+keylist[i].items[h].value+"</option>";
	    }
	    keyselect_html += "</optgroup>";
	}
	keyselect.innerHTML = keyselect_html;

	// check if a search got passed
	if (Retina.cgiParam("search")) {
	    document.getElementById('searchtext').value = Retina.cgiParam("search");

	    if (Retina.cgiParam("opt_mg")) {
		if (Retina.cgiParam("opt_mg") == "on") {
		    document.getElementById('metadata_button').className = "btn btn-mini span1 active";
		} else {
		    document.getElementById('metadata_button').className = "btn btn-mini span1";
		}
	    }
	    if (Retina.cgiParam("opt_fn")) {
		if (Retina.cgiParam("opt_fn") == "on") {
		    document.getElementById('function_button').className = "btn btn-mini span1 active";
		} else {
		    document.getElementById('function_button').className = "btn btn-mini span1";
		}
	    }
	    if (Retina.cgiParam("opt_og")) {
		if (Retina.cgiParam("opt_og") == "on") {
		    document.getElementById('organism_button').className = "btn btn-mini span1 active";
		} else {
		    document.getElementById('organism_button').className = "btn btn-mini span1";
		}
	    }
	} else if (Retina.cgiParam("stored") != "") {
	    widget.showStoredSearch(Retina.cgiParam("stored"));
	}

	Retina.WidgetInstances.metagenome_search[1].queryAPI();
    };

    widget.showStoredSearch = function (index) {
	var widget = Retina.WidgetInstances.metagenome_search[1];
	
	var searches = Retina.keys(stm.user.preferences.searches).sort();
	var search = stm.user.preferences.searches[searches[index]];
	widget.refineSearch('restore', search);
    };

    widget.deleteStoredSearch = function (index) {
	var widget = Retina.WidgetInstances.metagenome_search[1];
	
	var searches = Retina.keys(stm.user.preferences.searches).sort();
	delete stm.user.preferences.searches[searches[index]];
	searches = Retina.keys(stm.user.preferences.searches).sort();
	if (searches.length) {
	    var sidehtml = "<ul class='selectList'>";
	    for (var i=0; i<searches.length; i++) {
		var item = stm.user.preferences.searches[searches[i]];
		sidehtml += "<li title='"+item.description+"'><a onclick='Retina.WidgetInstances.metagenome_search[1].showStoredSearch("+i+");'>"+item.name+"</a><button class='btn btn-mini btn-danger pull-right' onclick='Retina.WidgetInstances.metagenome_search[1].deleteStoredSearch("+i+");' title='permanently delete this search'>delete</button></li>";
	    }
	    sidehtml += "</ul>";
	    document.getElementById('storedresults_div').innerHTML = sidehtml;
	} else {
	    document.getElementById('storedresults_div').innerHTML = "<p>You currently have no stored searches</p>";
	}
	stm.storePreferences("search deleted", "there was an error deleting your search");
    };

    widget.updateStoredSearches = function () {
	if (stm.user) {
	    if (! stm.user.hasOwnProperty("preferences")) {
		stm.user.preferences = {};
	    }
	    if (! stm.user.preferences.hasOwnProperty("searches")) {
		stm.user.preferences.searches = {};
	    }
	    var searches = Retina.keys(stm.user.preferences.searches).sort();
	    if (searches.length) {
		var sidehtml = "<ul class='selectList'>";
		for (var i=0; i<searches.length; i++) {
		    var item = stm.user.preferences.searches[searches[i]];
		    sidehtml += "<li title='"+item.description+"'><a onclick='Retina.WidgetInstances.metagenome_search[1].showStoredSearch("+i+");'>"+item.name+"</a><button class='btn btn-mini btn-danger pull-right' onclick='Retina.WidgetInstances.metagenome_search[1].deleteStoredSearch("+i+");' title='permanently delete this search'>delete</button></li>";
		}
		sidehtml += "</ul>";
		document.getElementById('storedresults_div').innerHTML = sidehtml;
	    }
	}
    };

    widget.refineSearch = function (action, item) {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	// get the DOM space for the buttons
	var target = document.getElementById('refine_search_terms');

	if (action == "add") {

	    // add key and value to the advance options
	    var skeyList = document.getElementById('advanced_search_key');
	    var skey = skeyList.options[skeyList.selectedIndex].value;
	    var sname = skeyList.options[skeyList.selectedIndex].text;
	    var sval = document.getElementById('advanced_search_value').value;
	    widget.advancedOptions[skey] = sval;
	    widget.checkStoreSearch();

	    // check if this is the first button
	    if (target.innerHTML == "") {
		// create a 'clear' button

		var clear = document.createElement('button');
		clear.className = "btn btn-small btn-danger";
		clear.innerHTML = "clear advanced options";
		clear.addEventListener('click', function () {
		    Retina.WidgetInstances.metagenome_search[1].refineSearch("clear");
		});
		clear.setAttribute('style', "width: 100%; clear: both; margin-bottom: 20px; margin-top: -15px;");
		target.appendChild(clear);
	    }
	    
	    var button = document.createElement('button');
	    button.className = "btn btn-small";
	    button.setAttribute('style', "float: left; margin-right: 10px; margin-bottom: 10px;");
	    button.innerHTML = sname+" - "+sval+" <i class='icon icon-remove'></i>";
	    button.title = "click to remove";
	    button.setAttribute('id', 'advSearch_'+skey);
	    button.skey = skey;
	    button.addEventListener('click', function() {
		Retina.WidgetInstances.metagenome_search[1].refineSearch("remove", this.skey);
	    });
	    target.appendChild(button);
	} else if (action == "remove") {
	    delete widget.advancedOptions[item];
	    target.removeChild(document.getElementById('advSearch_'+item));
	    if (target.childNodes.length == 1) {
		target.innerHTML = "";
	    }
	} else if (action == "clear") {
	    widget.advancedOptions = {};
	    target.innerHTML = "";
	} else if (action == "restore" && item) {
	    widget.advancedOptions = item.advancedOptions;
	    target.innerHTML = "";
	    var clear = document.createElement('button');
	    clear.className = "btn btn-small btn-danger";
	    clear.innerHTML = "clear advanced options";
	    clear.addEventListener('click', function () {
		Retina.WidgetInstances.metagenome_search[1].refineSearch("clear");
	    });
	    clear.setAttribute('style', "width: 100%; clear: both; margin-bottom: 20px; margin-top: -15px;");
	    target.appendChild(clear);
	    for (var i in widget.advancedOptions) {
		var skey = i;
		var sname = widget.specialKeyMapping[i] ? widget.specialKeyMapping[i] : i.replace(/_/g, " ");
		var sval = widget.advancedOptions[i];
		var button = document.createElement('button');
		button.className = "btn btn-small";
		button.setAttribute('style', "float: left; margin-right: 10px; margin-bottom: 10px;");
		button.innerHTML = sname+" - "+sval+" <i class='icon icon-remove'></i>";
		button.title = "click to remove";
		button.setAttribute('id', 'advSearch_'+skey);
		button.skey = skey;
		button.addEventListener('click', function() {
		    Retina.WidgetInstances.metagenome_search[1].refineSearch("remove", this.skey);
		});
		target.appendChild(button);
	    }
	} else {
	    console.log("undefined action for refineSearch");
	    return;
	}
	widget.queryAPI();
    };
    
    widget.resultTable = function (data, total_count) {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	var showing = "all matches.";
	var num = 0;
	for (var i in data) {
	    if (data.hasOwnProperty(i)) {
		num++;
	    }
	}
	if (num < total_count) {
	    showing = "the first "+num+" matches.";
	}
	if (total_count == 0) {
	    document.getElementById('result_text').innerHTML = "Your search returned no results.";
	} else {
	    document.getElementById('result_text').innerHTML = "Your search returned "+total_count+" results. Showing "+showing;
	}

	var html = "";
	
	html += "<table class='table' style='font-size: 12px;'><thead><tr>";
	var fields = ["sequence_type", "name", "id", "project_name", "biome", "feature", "material", "country", "location"];
	var fnames = ["Seq&nbsp;Type", "Metagenome", "MG-RAST&nbsp;ID", "Project", "Biome", "Feature", "Material", "Country", "Location"];
	var widths = [ 85, 105, 105, 85, 85, 85, 85, 85, 85 ];
	for (var i=0;i<fields.length;i++) {
	    var style_a = "";
	    var style_d = "";
	    if (widget.sort == fields[i]) {
		if (widget.sortDir == 'asc') {
                    style_a = "border: 1px solid #0088CC; border-radius: 7px; padding: 1px 1px 2px;";
		} else {
                    style_d = "border: 1px solid #0088CC; border-radius: 7px; padding: 2px 1px 1px;";
		}
            }
            html += "<th style='min-width: "+widths[i]+"px;'>"+fnames[i]+"&nbsp;<img onclick=\"Retina.WidgetInstances.metagenome_search[1].sortQuery(\'"+fields[i]+"\', \'asc\');\" src=\"Retina/images/up-arrow.gif\" style=\"cursor: pointer;"+style_a+"\" />"+
                "<img onclick=\"Retina.WidgetInstances.metagenome_search[1].sortQuery(\'"+fields[i]+"\', \'desc\');\" src=\"Retina/images/down-arrow.gif\" style=\"cursor: pointer;"+style_d+"\" />";
	    
            html += "</th>";
	}
	html += "</tr></thead><tbody>";
	
	var rows = [];
	for (var i in data) {
            if (data.hasOwnProperty(i)) {
		rows.push( [ i, data[i].name ] );
            }
	}

	for (var i=0;i<rows.length;i++) {
	    
            data[rows[i][0]]["project_id"] = data[rows[i][0]]["project_id"].substr(3);
            data[rows[i][0]]["id"] = data[rows[i][0]]["id"].substr(3);
	    
            html += "<tr>";
            html += "<td>"+data[rows[i][0]]["sequence_type"]+"</td>";
            html += "<td style='max-width: 200px; overflow: hidden;'><a href='?mgpage=overview&metagenome="+data[rows[i][0]]["id"]+"' target=_blank title='"+data[rows[i][0]]["name"]+"'>"+data[rows[i][0]]["name"]+"</a></td>";
            html += "<td>"+data[rows[i][0]]["id"]+"</td>";
            html += "<td><a href='?mgpage=project&project="+data[rows[i][0]]["project_id"]+"' target=_blank>"+data[rows[i][0]]["project_name"]+"</a></td>";
            html += "<td>"+data[rows[i][0]]["biome"]+"</td>";
            html += "<td>"+data[rows[i][0]]["feature"]+"</td>";
            html += "<td>"+data[rows[i][0]]["material"]+"</td>";
            html += "<td>"+data[rows[i][0]]["country"]+"</td>";
            html += "<td>"+data[rows[i][0]]["location"]+"</td>";
            html += "</tr>";
	}
        
	html += "<tbody></table>";

	if (num < total_count) {
	    html += "<div><table width=100% style='text-align: center;'><tr><td><button class='btn btn-mini' onclick='Retina.WidgetInstances.metagenome_search[1].queryAPI(true);'>more</button></td></tr></table></div>";
	}

	return html;
    };

    widget.queryAPI = function (more) {
	var widget = Retina.WidgetInstances.metagenome_search[1];
	
	// get params
	widget.query = document.getElementById("searchtext").value;
	widget.checkStoreSearch();
	
	if (! stm.DataStore.hasOwnProperty('search') ) {
	    stm.DataStore.search = {};
	}
	if (more) {
	    widget.offset += widget.limit;
	} else {
	    stm.DataStore.search = {};
	    widget.offset = 0;
	}

	var api_url = RetinaConfig.mgrast_api + '/metagenome?verbosity=mixs&';
			
	// metadata function organism
	var type = [];
	var poss = [ 'metadata', 'organism', 'function' ];
	for (var i=0; i<poss.length; i++) {
	    var btn = document.getElementById(poss[i] + '_button');
	    for (var h=0; h<btn.classList.length; h++) {
		if (btn.classList[h] == 'active') {
		    type.push(poss[i]);
		    break;
		}
	    }
	}

	widget.match = "all";
	
	var query_str = "";
	for (var h=0;h<type.length; h++) {
	    if(query_str != "") {
		query_str += "&";
	    }
	    query_str += type[h] + "=" + widget.query.split(/\s/).join("&"+type[h]+"=");
	}

	for (var h in widget.advancedOptions) {
	    if (widget.advancedOptions.hasOwnProperty(h)) {
		query_str += "&"+h;
		query_str += "=\""+widget.advancedOptions[h] + "\"";
	    }
	}

	var url = api_url + query_str + "&order=" + widget.sort + "&direction=" + widget.sortDir + "&match=" + widget.match + "&limit=" + widget.limit + "&offset=" + widget.offset;
	
	jQuery.ajax( { dataType: "json",
		       url: url,
		       headers: stm.authHeader,
		       success: function(data) {
			   for (var i=0;i<data.data.length;i++) {
			       stm.DataStore.search[data.data[i]["id"]] = data.data[i];
			   }
			   
			   document.getElementById('result').innerHTML = Retina.WidgetInstances.metagenome_search[1].resultTable(stm.DataStore.search, data.total_count);
		       },
		       error: function () {
			   widget.target.innerHTML = "<div class='alert alert-error' style='width: 50%;'>You do not have the permisson to view this data.</div>";
		       }
		     });
	return;
    };

    widget.sortQuery = function (field, direction) {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	widget.sort = field;
	widget.sortDir = direction;

	widget.queryAPI();
    };

    widget.checkStoreSearch = function () {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	var btn = document.getElementById('storeSearchButton');
	if (stm.user && (Retina.keys(widget.advancedOptions).length || widget.query)) {
	    btn.removeAttribute("disabled");
	} else {
	    btn.setAttribute("disabled", "true");
	}
    };

    widget.storeSearch = function () {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	if (! stm.user) {
	    alert('you must be logged in to store a search');
	    return;
	}

	var types = [];
	var poss = [ 'metadata', 'organism', 'function' ];
	for (var i=0; i<poss.length; i++) {
	    var btn = document.getElementById(poss[i] + '_button');
	    for (var h=0; h<btn.classList.length; h++) {
		if (btn.classList[h] == 'active') {
		    types.push(poss[i]);
		    break;
		}
	    }
	}
	
	var search = { type: "search",
		       querytypes: types,
		       name: document.getElementById('searchresult_name').value,
		       description: document.getElementById('searchresult_description').value,
		       query: widget.query,
		       advancedOptions: widget.advancedOptions };

	if (stm.user.preferences.searches.hasOwnProperty(search.name)) {
	    alert('you already have a search store with that name');
	} else {
	    stm.user.preferences.searches[search.name] = search;
	    stm.storePreferences("search stored", "there was an error storing your search");
	    widget.updateStoredSearches();
	}
    };
})();
