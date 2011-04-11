(function(c,i){i=i||{};i.FormValidator=function(e){e.use("Mustache","mustache");var a=e.context_prototype.prototype.mustache,d={MESSAGES:{maxlength:"Too long",minlength:"Too short",required:"This field is required",pattern:"Not a valid "},validateField:function(b){var g=this,f=c(b),h=["required","maxlength","pattern"];if(f.hasClass("input-error")||!f.hasClass("input-valid"))c.each(h,function(j){f.data("h5-"+h[j])&&g.Messenger.appendErrorMessage(h[j],f)});else f.hasClass("input-valid")&&d.Messenger.hideInputError(f)}};
d.Messenger={formMessage:function(b,g,f){c(b).find(".submit-error, .submit-success").remove().end().find("input[type=submit]").after(a(g,f))},appendErrorMessage:function(b,g){var f=g.val().toLowerCase();switch(b){case "maxlength":if(f.length>g.attr("maxlength")){this.showInputError(g,d.MESSAGES.maxlength);return false}break;case "required":if(f.length===0){this.showInputError(g,d.MESSAGES.required);return false}break;case "pattern":if(g.data("h5-pattern").test(f.toLowerCase())===false){if(g.hasClass("h5-minLength"))this.showInputError(g,
d.MESSAGES.minlength);else g.hasClass("h5-email")?this.showInputError(g,d.MESSAGES.pattern+"email"):this.showInputError(g,d.MESSAGES.pattern+"URL");return false}else g.removeClass("input-error")}},showInputError:function(b,g){var f=a('<div class="error-msg">{{msg}}</div>',{msg:g});b.prev(".error-msg").length!==0?this.hideInputError(b).before(f):b.before(f)},hideInputError:function(b){return b.prev(".error-msg").remove().end()}};d.Submitter={processSubmission:function(b,g,f,h){c(g).remove(".submit-error, .submit-success");
if(b){d.Messenger.formMessage(g,f,h);this.clearForm(c(g))}else d.Messenger.formMessage(g,f,h)},clearForm:function(b){b.find("input:not([type=submit]), textarea").val("")}};this.helpers({validate:function(b){d.validateField(b)},successfulSubmission:function(b,g,f){d.Submitter.processSubmission(true,b,g,f)},unSuccessfulSubmission:function(b,g,f){d.Submitter.processSubmission(false,b,g,f)},clearForm:function(b){d.Submitter.clearForm(c(b))}})}})(jQuery,window.Sammy);(function(c,i){i=i||{};i.Paginator=function(e,a){a||(a="paginate");e.helper(a,function(d,b){var g=this;return this.send(d,b).then(function(f){var h;h=f.rows.length==b.limit?f.rows.pop():{key:null,id:null};g.pagination(b.reference,{nextKey:h.key,nextKeyID:h.id});h=[];var j=b.reference,k=b.limit;if(j.nextIndex){k+=j.nextIndex-1;h=f.rows[0].value.slice(j.nextIndex,k)}else for(j=0;j<f.rows.length;j+=1)h.push(f.rows[j].value);return{rows:h}})})}})(jQuery,window.Sammy);(function(c){var i=c.sammy("body",function(){this.use("Mustache","ms").use("Couch","underground-git").use("FormValidator").use("Paginator","paginate");this.raise_errors=true;this.debug=false;this.helpers({fancyDates:function(){var e=this;c(".fancy-time").each(function(){var a=new Date(c(this).attr("datetime")),d=a.strftime("%d");a=a.strftime("%m.%y");c(this).html(e.ms('<span class="day">{{day}}</span> {{mnt_yr}}',{day:d,mnt_yr:a}))})},prettyDates:function(){c("time:not(.fancy-time)").timeago()},chooseAtRandom:function(e){return e.rows[Math.floor(Math.random()*
25)].value},onHomepage:function(){return!/(articles|screencasts|scripts|about)$/.test(document.location.pathname)},loadBlurbs:function(e,a,d){var b=this.db.name,g={descending:true,type:a.replace(/^\.|#/g,""),success:function(f){c(a).append(f.body).data("last-key",f.key);Hyphenator.run()}};c.extend(d,g);c.couch.db(b).list(b+"/blurbs",e,d);return this},validateInputs:function(e,a,d){var b=this;if(e.lol1||e.lol2)throw Error("Nice try.");if(c(".input-valid").length<3){c.each([".h5-url",".h5-minLength",
"textarea"],function(g,f){b.validate(f)});e={msg:"Sorry, your submission didn't go through. Make sure you have filled in all inputs correctly and try again.",submitClass:"submit-error"};b.unSuccessfulSubmission(a,'<p class="{{submitClass}} hyphenate">{{msg}}</p>',e)}else d()}});this.get("#/",function(){if(this.onHomepage()){this.loadBlurbs("script_fragment","#scripts",{limit:12,rows:4,cols:3,heading:"Latest Script Activity"});this.loadBlurbs("latest_screencasts","#screencasts",{limit:6,rows:3,cols:2,
trlen:28,heading:"Latest Screencasts"})}/scripts$/.test(document.location.pathname)&&this.loadBlurbs("by_rating","#by-rating",{limit:14,rows:7,cols:2,heading:"Popular Scripts"})});this.post("#/new",function(e){e.validateInputs(e.params,e.target,function(){e.send(Article.processNewDoc,e.params,e.target)})});this.post("#/contact",function(e){var a=e.target,d;c.ajax({type:"POST",url:"/mail",data:{sender:e.params.name,email:e.params.email,subject:"Vim Underground Inquiry",message:e.params.message},dataType:"json",
success:function(){d="Message sent! Thank you for your inquiry!";e.successfulSubmission(a,'<p class="{{klass}}">{{{msg}}}</p>',{klass:"submit-success",msg:d})},error:function(){d='Sorry, but your email could not be sent. You can try again or use your <a href="mailto:your@email.com">email client</a> to send the message.';e.unSuccessfulSubmission(a,'<p class="{{klass}}">{{{msg}}}</p>',{klass:"submit-error",msg:d})}})});this.bind("show-hide-header",function(e,a){var d=a.$parent,b=a.$menu,g=parseInt(d.css("top"))<
0?0:-50;d.animate({top:g},"fast",function(){if(b.hasClass("up"))b.removeClass("up").addClass("down");else b.hasClass("down")&&b.removeClass("down").addClass("up")})});this.bind("show-more",function(e,a){var d=a.selector,b=a.options,g=b.view,f=a.parent.data("last-key");b={limit:b.limit||15,rows:b.rows||3,cols:b.cols||5,startkey:typeof f==="string"?f.split(",",2):f,skip:1};this.loadBlurbs(g,d,b)});this.bind("add-article",function(e,a){var d=this,b=a.target,g=a.doc,f=g.type,h;Article.save(g,{success:function(){h=
f.capitalize()+" successfully submitted! It will appear alongside other "+f.pluralize()+" after being reviewed.";d.successfulSubmission(b,'<p class="{{klass}}">{{msg}}</p>',{klass:"submit-success",msg:h})},error:function(j,k,l){h=/Document update conflict/.test(l)?(f==="article"?"An ":"A ")+f+" with the same URL already exists.":f.capitalize()+" not created! Please make sure you havefilled out all input fields and that they're valid before trying again. If the problem persists, feel free to contact me.";
d.unSuccessfulSubmission(b,'<p class="{{klass}}">{{msg}}</p>',{klass:"submit-error",msg:h})}})});this.bind("load-validation",function(e,a){var d=c(a.form);c.h5Validate.addPatterns({minLength:/^(\w.*){5,}$/,url:RegExp("(https?|ftps?)\\://(((?:(?:[\\da-zA-Z](?:[-\\da-zA-Z]{0,61}[\\da-zA-Z])?)\\.)+(?:[a-zA-Z](?:[-\\da-zA-Z]{0,6}[\\da-zA-Z])?)\\.?))(\\:\\d+)?(/(?:[^?#\\s/]+/)*(?:[^?#\\s/]+(?:\\?[^?#\\s/]*)?(?:#[A-Za-z][\\w.:-]*)?)?)?")});d.h5Validate({kbSelectors:"[name=title], [type=url], [type=email], [name=name], textarea",
keyup:true,errorClass:"input-error",validClass:"input-valid",debug:false}).bind("submit",function(b){b.preventDefault()})});this.bind("run",function(){var e=this;c("#menu-link a","header").bind("click",function(a){a.preventDefault();e.trigger("show-hide-header",{$parent:c(this).parents("header"),$menu:c(this)})});e.trigger("load-validation",{form:"form"});c(".submit").live("click",function(a){a.preventDefault();a=c("#menu-link a");c(".overlay").fadeIn("fast");c(this).parents("header").length>0&&e.trigger("show-hide-header",
{$parent:a.parents("header"),$menu:a})});c("input:not([type=submit]), textarea",c(this).parent("form")[0]).live("keydown",function(){e.validate(this)});c(".close").live("click",function(a){a.preventDefault();c(".overlay").fadeOut("fast")});c(".more").live("click",function(a){if(!e.onHomepage()){a.preventDefault();a=c(this).parent("section");var d,b;d="#"+a.attr("id");mappings={articles:{view:"latest_articles"},"t-screencasts":{view:"latest_screencasts"},"t-scripts":{view:"script_fragment",limit:21,
rows:7,cols:3},"by-rating":{view:"by_rating",limit:14,rows:7,cols:2}};b=mappings[d.replace("#","")];c(this).remove();e.trigger("show-more",{parent:a,selector:d,view:void 0,options:b})}})})});c(function(){i.run("#/")})})(jQuery);Article=Sammy("body").createModel("article");
Article.extend({getScreenCastRegex:function(){return/http:\/\/(.*youtube\.com\/watch.*|.*\.youtube\.com\/v\/.*|youtu\.be\/.*|.*\.youtube\.com\/user\/.*|.*\.youtube\.com\/.*#.*\/.*|m\.youtube\.com\/watch.*|m\.youtube\.com\/index.*|.*\.youtube\.com\/profile.*|.*justin\.tv\/.*|.*justin\.tv\/.*\/b\/.*|.*justin\.tv\/.*\/w\/.*|www\.ustream\.tv\/recorded\/.*|www\.ustream\.tv\/channel\/.*|www\.ustream\.tv\/.*|qik\.com\/video\/.*|qik\.com\/.*|qik\.ly\/.*|.*revision3\.com\/.*|.*\.dailymotion\.com\/video\/.*|.*\.dailymotion\.com\/.*\/video\/.*|www\.collegehumor\.com\/video:.*|.*twitvid\.com\/.*|www\.break\.com\/.*\/.*|vids\.myspace\.com\/index\.cfm\?fuseaction=vids\.individual&videoid.*|www\.myspace\.com\/index\.cfm\?fuseaction=.*&videoid.*|www\.metacafe\.com\/watch\/.*|www\.metacafe\.com\/w\/.*|blip\.tv\/file\/.*|.*\.blip\.tv\/file\/.*|video\.google\.com\/videoplay\?.*|.*revver\.com\/video\/.*|video\.yahoo\.com\/watch\/.*\/.*|video\.yahoo\.com\/network\/.*|.*viddler\.com\/explore\/.*\/videos\/.*|liveleak\.com\/view\?.*|www\.liveleak\.com\/view\?.*|animoto\.com\/play\/.*|dotsub\.com\/view\/.*|www\.overstream\.net\/view\.php\?oid=.*|www\.livestream\.com\/.*|www\.worldstarhiphop\.com\/videos\/video.*\.php\?v=.*|worldstarhiphop\.com\/videos\/video.*\.php\?v=.*|teachertube\.com\/viewVideo\.php.*|www\.teachertube\.com\/viewVideo\.php.*|www1\.teachertube\.com\/viewVideo\.php.*|www2\.teachertube\.com\/viewVideo\.php.*|bambuser\.com\/v\/.*|bambuser\.com\/channel\/.*|bambuser\.com\/channel\/.*\/broadcast\/.*|www\.schooltube\.com\/video\/.*\/.*|bigthink\.com\/ideas\/.*|bigthink\.com\/series\/.*|sendables\.jibjab\.com\/view\/.*|sendables\.jibjab\.com\/originals\/.*|www\.xtranormal\.com\/watch\/.*|dipdive\.com\/media\/.*|dipdive\.com\/member\/.*\/media\/.*|dipdive\.com\/v\/.*|.*\.dipdive\.com\/media\/.*|.*\.dipdive\.com\/v\/.*|www\.whitehouse\.gov\/photos-and-video\/video\/.*|www\.whitehouse\.gov\/video\/.*|wh\.gov\/photos-and-video\/video\/.*|wh\.gov\/video\/.*|www\.hulu\.com\/watch.*|www\.hulu\.com\/w\/.*|hulu\.com\/watch.*|hulu\.com\/w\/.*|.*crackle\.com\/c\/.*|www\.fancast\.com\/.*\/videos|www\.funnyordie\.com\/videos\/.*|www\.funnyordie\.com\/m\/.*|funnyordie\.com\/videos\/.*|funnyordie\.com\/m\/.*|www\.vimeo\.com\/groups\/.*\/videos\/.*|www\.vimeo\.com\/.*|vimeo\.com\/m\/#\/featured\/.*|vimeo\.com\/groups\/.*\/videos\/.*|vimeo\.com\/.*|vimeo\.com\/m\/#\/featured\/.*|www\.ted\.com\/talks\/.*\.html.*|www\.ted\.com\/talks\/lang\/.*\/.*\.html.*|www\.ted\.com\/index\.php\/talks\/.*\.html.*|www\.ted\.com\/index\.php\/talks\/lang\/.*\/.*\.html.*|.*nfb\.ca\/film\/.*|www\.thedailyshow\.com\/watch\/.*|www\.thedailyshow\.com\/full-episodes\/.*|www\.thedailyshow\.com\/collection\/.*\/.*\/.*|movies\.yahoo\.com\/movie\/.*\/video\/.*|movies\.yahoo\.com\/movie\/.*\/trailer|movies\.yahoo\.com\/movie\/.*\/video|www\.colbertnation\.com\/the-colbert-report-collections\/.*|www\.colbertnation\.com\/full-episodes\/.*|www\.colbertnation\.com\/the-colbert-report-videos\/.*|www\.comedycentral\.com\/videos\/index\.jhtml\?.*|www\.theonion\.com\/video\/.*|theonion\.com\/video\/.*|wordpress\.tv\/.*\/.*\/.*\/.*\/|www\.traileraddict\.com\/trailer\/.*|www\.traileraddict\.com\/clip\/.*|www\.traileraddict\.com\/poster\/.*|www\.escapistmagazine\.com\/videos\/.*|www\.trailerspy\.com\/trailer\/.*\/.*|www\.trailerspy\.com\/trailer\/.*|www\.trailerspy\.com\/view_video\.php.*|www\.atom\.com\/.*\/.*\/|fora\.tv\/.*\/.*\/.*\/.*|www\.spike\.com\/video\/.*|www\.gametrailers\.com\/video\/.*|gametrailers\.com\/video\/.*|www\.koldcast\.tv\/video\/.*|www\.koldcast\.tv\/#video:.*|techcrunch\.tv\/watch.*|techcrunch\.tv\/.*\/watch.*|mixergy\.com\/.*|video\.pbs\.org\/video\/.*|www\.zapiks\.com\/.*|tv\.digg\.com\/diggnation\/.*|tv\.digg\.com\/diggreel\/.*|tv\.digg\.com\/diggdialogg\/.*|www\.trutv\.com\/video\/.*|www\.nzonscreen\.com\/title\/.*|nzonscreen\.com\/title\/.*|app\.wistia\.com\/embed\/medias\/.*|https:\/\/app\.wistia\.com\/embed\/medias\/.*|www\.godtube\.com\/featured\/video\/.*|godtube\.com\/featured\/video\/.*|www\.godtube\.com\/watch\/.*|godtube\.com\/watch\/.*|www\.tangle\.com\/view_video.*|mediamatters\.org\/mmtv\/.*|www\.clikthrough\.com\/theater\/video\/.*|espn\.go\.com\/video\/clip.*|espn\.go\.com\/.*\/story.*|abcnews\.com\/.*\/video\/.*|abcnews\.com\/video\/playerIndex.*|washingtonpost\.com\/wp-dyn\/.*\/video\/.*\/.*\/.*\/.*|www\.washingtonpost\.com\/wp-dyn\/.*\/video\/.*\/.*\/.*\/.*|www\.boston\.com\/video.*|boston\.com\/video.*|www\.facebook\.com\/photo\.php.*|www\.facebook\.com\/video\/video\.php.*|www\.facebook\.com\/v\/.*|cnbc\.com\/id\/.*\?.*video.*|www\.cnbc\.com\/id\/.*\?.*video.*|cnbc\.com\/id\/.*\/play\/1\/video\/.*|www\.cnbc\.com\/id\/.*\/play\/1\/video\/.*|cbsnews\.com\/video\/watch\/.*|www\.google\.com\/buzz\/.*\/.*\/.*|www\.google\.com\/buzz\/.*|www\.google\.com\/profiles\/.*|google\.com\/buzz\/.*\/.*\/.*|google\.com\/buzz\/.*|google\.com\/profiles\/.*|www\.cnn\.com\/video\/.*|edition\.cnn\.com\/video\/.*|money\.cnn\.com\/video\/.*|today\.msnbc\.msn\.com\/id\/.*\/vp\/.*|www\.msnbc\.msn\.com\/id\/.*\/vp\/.*|www\.msnbc\.msn\.com\/id\/.*\/ns\/.*|today\.msnbc\.msn\.com\/id\/.*\/ns\/.*|multimedia\.foxsports\.com\/m\/video\/.*\/.*|msn\.foxsports\.com\/video.*|www\.globalpost\.com\/video\/.*|www\.globalpost\.com\/dispatch\/.*)/i},isScreencast:function(c){return Article.getScreenCastRegex().test(c)},
processNewDoc:function(c,i){var e=Sammy("body"),a={};if(c.lol1||c.lol2)throw Error("Looks like you're a bot. Epic fail.");for(key in c)/^lol\d$/.test(key)||(a[key]=c[key]);a.posted_on=Date();a.approved=false;if(Article.isScreencast(c.link))$.embedly(c.link,{urlRe:Article.getScreenCastRegex(),success:function(d){a.html=d.html;a.thumb_url=d.thumbnail_url;a.author=d.author;a.author_website=d.author_website;a.type="screencast";e.trigger("add-article",{doc:a,target:i})}});else{a.type="article";e.trigger("add-article",
{doc:a,target:i})}},beforeSave:function(c){if(!c._id){if(!/^https?:\/\//.test(c.link))c.link="http://"+c.link;c._id=c.link;delete c.link}return c}});
