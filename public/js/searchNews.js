// JSON based simple full text search with vanilla javascript via XMLHttpRequest,
// (c) 2020 by Tanja Becker - Webdeveleopment, http://tanjabecker.de/

// pass query string by CGI parameter: [URL]?query=[search string]

var query = new URLSearchParams(window.location.search).get("query");
if ((query != '') && (query != null)) {
  document.getElementById("custom-search-field").value = query;
}

// Debug mode: shows number of hits in the search result. [URL]?debug=1
let debug = new URLSearchParams(window.location.search).get("debug");

let merge_data = [];

window.addEventListener('load', function() {
	document.getElementById("custom-search").querySelectorAll("input").forEach(item => {
		item.disabled = 'disabled';
	});
	if (!merge_data.length) {
		document.getElementById("custom-search-results").innerHTML = params['json_wait'];
		
		if (params['json_src'] != '') {
			var json_src_str = params['json_src'].replace("/\s/g", "");
			var json_sources = json_src_str.split(",");
			
			var src_count = 0;
			for (var i = 0; i < json_sources.length; i++) {
				var xmlhttp = new XMLHttpRequest();
				var url = json_sources[i];
				xmlhttp.onreadystatechange = function() {
					if (this.readyState == 4 && this.status == 200) {
						//console.log(this.responseText);
						var data = JSON.parse(this.responseText);
						for (var i = 0; i < data.length; i++) {
							merge_data.push(data[i]);
						}
						src_count++;
						
						if (src_count == json_sources.length) {
							document.getElementById("custom-search").querySelectorAll("input").forEach(item => {
								item.disabled = '';
							});
							
							document.getElementById("custom-search-field").focus();
							document.getElementById("custom-search-results").innerHTML = params['json_ready'];
							
							if ((query != '') && (query != null)) {
								customSearchResults();
							}
						}
					} 
					if (this.status == 404) {
						document.getElementById("custom-search-results").innerHTML = params['err_filefailed'];
					}
				};
				xmlhttp.open("GET", url, true);
				xmlhttp.send();
			}
		}
	}
}, false); 

document.getElementById("custom-search-field").addEventListener('keyup', function(e) {
	if (params['autocomplete'] == 1) {
		document.getElementById("custom-search-results").innerHTML = '';
		if (this.value == '') {
			document.getElementById("custom-search-results").innerHTML = params['err_nostring'];	
			document.getElementById("content").style.display = "block";
			return false;
		} else if (this.value.length < params['minlength']) {
			document.getElementById("custom-search-results").innerHTML = params['err_badstring'];
			document.getElementById("content").style.display = "block";
			return false;
		} else if (this.value.length >= params['minlength']) {
			customSearchResults();
		}
	} else {
		if (this.value == '') {
			document.getElementById("custom-search-results").innerHTML = params['err_nostring'];
		}
	}
});

let sForm = document.getElementById("custom-search");

if (params['defaultsearch'] != '') {
	sForm.querySelectorAll("input[name='option']").forEach(item => {
		item.addEventListener('click', event => {
			customSearchResults();
		});
	});
}

function customSearchResults() {
	if (!merge_data.length) {
		return false;
	}
	
	var sOutput = document.getElementById("custom-search-results");
	var sString = document.getElementById("custom-search-field").value;
	if (sString == null || sString == '' ) {
		sOutput.innerHTML = params['err_nostring'];
		return false;
	}
	if (sString.length < params['minlength']) {
		sOutput.innerHTML = params['err_badstring'];
		return false;
	}
	
	var data = merge_data;
	var add_searchlink = params['add_searchlink'];
	if ((add_searchlink) && (add_searchlink != '')) {
		add_searchlink = add_searchlink.replace(/\[QUERY\]/g, sString);
	}
	
	var sOption = '';
	var optionField = document.forms["custom-search"]["option"];
	if (optionField) {
		sOption = optionField.value;
	} else {
		sOption = params['defaultsearch'];
	} 
	
	var badwords = [];
	if (params['badwords'] != '') {
		var badwords_str = params['badwords'];
		badwords_str = badwords_str.replace("/\s/g", "");
		badwords = badwords_str.split(",");
	}
	
	var words = [];
	var search_words = [];
	//console.log("sString: "+sString);
	if (! sString.startsWith("\""))
	search_words = sString.split(" ");
	else {
		sString = sString.replaceAll("\"","");
		search_words[0] = sString;
	}
	//console.log(search_words);
	for (var i = 0; i < search_words.length; i++) {
		if (badwords.includes(search_words[i])) {
			continue;
		} else {
			words.push(search_words[i]);
		}
	}
	if (!words.length) {
		sOutput.innerHTML = params['err_badstring'];
		return false;
	}
	
	var results = [];
	for (var i = 0; i < data.length; i++) {
		var id = data[i].id;
		var permalink = data[i].permalink;
		var title   = data[i].title;
		var subtitle   = data[i].subtitle;
		var date = data[i].date;
		var img = data[i].img;
		var copyright = data[i].copyright;
		var teaser = data[i].teaser;
		var content = data[i].content;
		var description = data[i].description;
		
		var searchtext = '';
		if (title != '')   searchtext += title;
		if (subtitle != '')   searchtext += subtitle;
		if (teaser != '') searchtext += ' '+teaser;
	    if (content != '') searchtext += ' '+content;
		
		var matched = 0;
		var matches = 0;
		var matches_calc = 0;
		var title_matches = 0;
		var subtitle_matches = 0;
		var teaser_matches = 0;
		var content_matches = 0;
		for (var y = 0; y < words.length; y++) {
			var searchword = new RegExp(words[y], 'gi');
			if (searchword.test(searchtext) === true) {
				var wordmatches = searchtext.match(searchword);
				matches = matches + wordmatches.length;
				matches_calc = matches;
				
				for (var key in searchfield_weight) {
					var val = searchfield_weight[key];
					var searchstr = '';
					var count = '';
					if (key == 'title') searchstr = title;
					if (key == 'subtitle') searchstr = subtitle;
					if (key == 'teaser') searchstr = teaser; 
					if (key == 'content') searchstr = content; 
					
					if (searchword.test(searchstr) === true) {
						matches_calc = matches_calc + val;
						count = searchstr.match(searchword).length;
						if (key == 'title') title_matches = title_matches + count;
						if (key == 'subtitle') subtitle_matches = subtitle_matches + count;
						if (key == 'teaser') teaser_matches = teaser_matches + count; 
						if (key == 'content') content_matches = content_matches + count; 
					}           
				}
				matched++;
			}
		}
		
		data[i]['matches_calc'] = matches_calc;
		if ((debug != '') && (debug != null)) {
			data[i]['matches'] = matches;
			data[i]['title_matches'] = title_matches;
			data[i]['subtitle_matches'] = subtitle_matches;
			data[i]['teaser_matches'] = teaser_matches;
			data[i]['content_matches'] = content_matches;
		}
		if (sOption == 'OR') {
			if (matched >= 1) {
				results.push(data[i]);
			}
		} else {
			if (matched == words.length) {
				results.push(data[i]);
			}
		}
	} 
	
	// results
	if (results.length >= 1) {
		results.sort(function(a, b) {
			if (params['sort_id'] == 'DESC') {
				return b.id - a.id; // b.matches_calc - a.matches_calc || b.id - a.id;
			} else {
				return a.id - b.id; // b.matches_calc - a.matches_calc || a.id - b.id;
			}
		}); 
		
		var results_header = '';
		if (results.length > 1) {
			results_header = params['res_more_items'];
		} else {
			results_header = params['res_one_item'];
		} 
		results_header = results_header.replace("[CNT]", results.length);
		results_header = results_header.replace("[SEARCH]", sString);
		if ((add_searchlink) && (add_searchlink != '')) {
			results_header += add_searchlink;
		}
		
		var tag_top = params['res_out_top'];
		var tag_bottom = params['res_out_bottom'];
		
		var results_content = '';
		for (var i = 0; i < results.length; i++) {
			
			var id = results[i].id;
			var permalink = results[i].permalink;
			var title   = results[i].title;
			var subtitle   = results[i].subtitle;
			var date = results[i].date;
			var img = results[i].img;
			var copyright = results[i].copyright;
			var teaser = results[i].teaser;
			var content = results[i].content;
			var description = results[i].description; 
			
			// only for debug mode
			var infos = '';
			if ((debug != '') && (debug != null)) {
				var matches         = results[i].matches;
				var matches_calc    = results[i].matches_calc;
				var title_matches   = results[i].title_matches;
				var subtitle_matches   = results[i].subtitle_matches;
				var teaser_matches = results[i].teaser_matches;
				var content_matches = results[i].content_matches;
				
				var plus_title   = title_matches >=1   ? '+ '+searchfield_weight['title']   : '+ 0';
				var plus_subtitle   = subtitle_matches >=1   ? '+ '+searchfield_weight['subtitle']   : '+ 0';
				var plus_teaser = teaser_matches >=1 ? '+ '+searchfield_weight['teaser'] : '+ 0';
				var plus_content = content_matches >=1 ? '+ '+searchfield_weight['content'] : '+ 0';
				
				infos += '<table style="font-size: 12px; color: #666666;">';
				infos += '<tr><td style="width: 100px;"><b>Gesamt:</b></td><td style="text-align: right;">'+matches+'</td></tr>';
				infos += '<tr><td>Title ('+title_matches+'):</td><td style="text-align: right;">'+plus_title+'</td></tr>';
				infos += '<tr><td>Subtitle ('+subtitle_matches+'):</td><td style="text-align: right;">'+plus_subtitle+'</td></tr>';
				infos += '<tr><td>Teaser ('+teaser_matches+'):</td><td style="text-align: right;">'+plus_teaser+'</td></tr>';
				infos += '<tr><td>Content ('+content_matches+'):</td><td style="text-align: right;">'+plus_content+'</td></tr>';
				infos += '<tr><td><b>Gesamt neu:</b></td><td style="text-align: right;">'+matches_calc+'</td></tr>';
				infos += '</table><br>';
      }
	  
	  var templ = params['res_item_tpl'];
	  	  
	  if (templ) {
		  templ = templ.replaceAll("[TITLE]", title);
		  
          if (templ.includes("[SUBTITLE]")) {
            if (subtitle != '') { 
              templ = templ.replaceAll("[SUBTITLE]", subtitle);
            } else {
              templ = templ.replaceAll("[SUBTITLE]", '');
            }
          }
		  
          if (templ.includes("[PERMALINK]")) {
            if (permalink != '') { 
              templ = templ.replaceAll("[PERMALINK]", permalink);
            } else {
              templ = templ.replaceAll("[PERMALINK]", '');
            }
          }
		  if (templ.includes("[ID]")) {
			  if (id != '') { 
				  templ = templ.replaceAll("[ID]", id);
			  } else {
				  templ = templ.replaceAll("[ID]", '');
			  }
		  }
		  //console.log("templ: "+templ);
		  var newdate = new Date(date*1000);
		  var datestr = getFormattedDate(newdate);
		  if (templ.includes("[DATE]")) {
			  console.log("date: "+date+" "+datestr);
			  if (date != '') { 
				  templ = templ.replaceAll("[DATE]", datestr);
			  } else {
				  templ = templ.replaceAll("[DATE]", '');
			  }
		  }
		  if (templ.includes("[IMG]")) {
			  if (img != '') { 
				  templ = templ.replaceAll("[IMG]", img);
			  } else {
				  templ = templ.replaceAll("[IMG]", '');
			  }
		  }
		  if (templ.includes("[COPYRIGHT]")) {
			  if (copyright != '' && copyright != "<no value>") { 
				  console.log("copyright: "+copyright+"xxx");
				  templ = templ.replaceAll("[COPYRIGHT]", "&copy;"+copyright);
			  } else {
				  templ = templ.replaceAll("[COPYRIGHT]", '');
			  }
		  }
		  if (templ.includes("[DESCRIPTION]")) {
			  if (description != '') { 
				  templ = templ.replaceAll("[DESCRIPTION]", description);
			  } else {
				  templ = templ.replaceAll("[DESCRIPTION]", '');
			  }
		  }
		  results_content += templ;
		  if (infos != '') {
			  results_content += '<li>'+infos+'</li>';
		  }
	  }
  } 
  sOutput.innerHTML = results_header+tag_top+results_content+tag_bottom;
  document.getElementById("content").style.display = "none";
} else {
	var noresult = '';
	if ((add_searchlink) && (add_searchlink != '')) {
		noresult += add_searchlink;
	}
	noresult += params['err_noresult'];
	sOutput.innerHTML = noresult;
	document.getElementById("content").style.display = "block";
}
}

function getFormattedDate(date) {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
  
    return day + '.' + month + '.' + year;
}
