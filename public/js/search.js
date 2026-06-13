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
      return false;
    } else if (this.value.length < params['minlength']) {
      document.getElementById("custom-search-results").innerHTML = params['err_badstring'];
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
  console.log("sString: "+sString);
  if (! sString.startsWith("\""))
    search_words = sString.split(" ");
  else {
	  sString = sString.replaceAll("\"","");
	  search_words[0] = sString;
  }
  console.log(search_words);
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
    var title   = data[i].title;
    var author = data[i].author;
    var journal = data[i].journal;
	var link = data[i].link;
	var linktext = data[i].linktext;
	var link2 = data[i].link2;
	var linktext2 = data[i].linktext2;

    var searchtext = '';
    if (title != '')   searchtext += title;
    if (author != '') searchtext += ' '+author;
    if (journal != '') searchtext += ' '+journal;
   
    var matched = 0;
    var matches = 0;
    var matches_calc = 0;
    var title_matches = 0;
    var author_matches = 0;
    var journal_matches = 0;
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
          if (key == 'author') searchstr = author;
          if (key == 'journal') searchstr = journal; 
           
          if (searchword.test(searchstr) === true) {
            matches_calc = matches_calc + val;
            count = searchstr.match(searchword).length;
            if (key == 'title') title_matches = title_matches + count;
            if (key == 'author') author_matches = author_matches + count;
            if (key == 'journal') journal_matches = journal_matches + count; 
          }           
        }
        matched++;
      }
    }
    data[i]['matches_calc'] = matches_calc;
    if ((debug != '') && (debug != null)) {
      data[i]['matches'] = matches;
      data[i]['title_matches'] = title_matches;
      data[i]['author_matches'] = author_matches;
      data[i]['journal_matches'] = journal_matches;
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
        return b.matches_calc - a.matches_calc || b.id - a.id;
      } else {
        return b.matches_calc - a.matches_calc || a.id - b.id;
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
      var title   = results[i].title;
      var author = results[i].author;
	  var journal = results[i].journal;
      var id      = results[i].id;
	  var link = results[i].link; 
	  var linktext = results[i].linktext; 
	  var link2 = results[i].link2; 
	  var linktext2 = results[i].linktext2; 

      // only for debug mode
      var infos = '';
      if ((debug != '') && (debug != null)) {
        var matches         = results[i].matches;
        var matches_calc    = results[i].matches_calc;
        var title_matches   = results[i].title_matches;
        var author_matches = results[i].author_matches;
        var journal_matches = results[i].journal_matches;

        var plus_title   = title_matches >=1   ? '+ '+searchfield_weight['title']   : '+ 0';
        var plus_author = author_matches >=1 ? '+ '+searchfield_weight['author'] : '+ 0';
        var plus_journal = journal_matches >=1 ? '+ '+searchfield_weight['journal'] : '+ 0';

        infos += '<table style="font-size: 12px; color: #666666;">';
        infos += '<tr><td style="width: 100px;"><b>Gesamt:</b></td><td style="text-align: right;">'+matches+'</td></tr>';
        infos += '<tr><td>Title ('+title_matches+'):</td><td style="text-align: right;">'+plus_title+'</td></tr>';
        infos += '<tr><td>Author ('+author_matches+'):</td><td style="text-align: right;">'+plus_author+'</td></tr>';
        infos += '<tr><td>Journal ('+journal_matches+'):</td><td style="text-align: right;">'+plus_journal+'</td></tr>';
        infos += '<tr><td><b>Gesamt neu:</b></td><td style="text-align: right;">'+matches_calc+'</td></tr>';
        infos += '</table><br>';
      }

      var templ = params['res_item_tpl'];

      if (templ) {
        templ = templ.replace("[TITLE]", title);

        if (templ.includes("[ID]")) {
          if (id != '') { 
            templ = templ.replace("[ID]", id);
          } else {
            templ = templ.replace("[ID]", '');
          }
        }
        if (templ.includes("[AUTHOR]")) {
          if (author != '') { 
            templ = templ.replace("[AUTHOR]", author);
          } else {
            templ = templ.replace("[AUTHOR]", '');
          }
        }
        if (templ.includes("[JOURNAL]")) {
          if (journal != '') { 
            templ = templ.replace("[JOURNAL]", journal);
          } else {
            templ = templ.replace("[JOURNAL]", '');
          }
        }
        if (templ.includes("[LINK]")) {
          if (link != '') { 
            templ = templ.replace("[LINK]", link);
          } else {
            templ = templ.replace("[LINK]", '');
          }
        }
        if (templ.includes("[LINKTEXT]")) {
          if (linktext != '') { 
            templ = templ.replace("[LINKTEXT]", linktext+". ");
          } else {
            templ = templ.replace("[LINKTEXT]", '');
          }
        }
        if (templ.includes("[LINK2]")) {
          if (link2 != '') { 
            templ = templ.replace("[LINK2]", link2);
          } else {
            templ = templ.replace("[LINK2]", '');
          }
        }
        if (templ.includes("[LINKTEXT2]")) {
          if (linktext2 != '') { 
            templ = templ.replace("[LINKTEXT2]", linktext2 +". ");
          } else {
            templ = templ.replace("[LINKTEXT2]", '');
          }
        }
        results_content += templ;
        if (infos != '') {
          results_content += '<li>'+infos+'</li>';
        }
      }
    } 
    sOutput.innerHTML = results_header+tag_top+results_content+tag_bottom;
  } else {
    var noresult = '';
    if ((add_searchlink) && (add_searchlink != '')) {
      noresult += add_searchlink;
    }
    noresult += params['err_noresult'];
    sOutput.innerHTML = noresult;
  }
}
