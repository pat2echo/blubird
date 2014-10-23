/*
 * JavaScript Dashboard Class
 * Created On: 24-MAY-2014
 * Created By: Ogbuitepu O. Patrick
 *
 *pageshow
*/

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','js/app/analytics.js','ga');

var storedObjectsA = amplify.store();
	
console.log('all',  storedObjectsA );

var customUUIDkey = 'custom-uuid';
var customUUID = getData( customUUIDkey );
if( ! customUUID ){
	var launch_date = new Date();
	var customUUID = launch_date.getTime();
	putData( customUUIDkey , customUUID );
	
	/*
	$.each(demo_data, function(key, val){
		putData( key , val );
	});
	*/
}

ga('create', 'UA-55105908-2', {
	'storage': 'none',
	//'clientId':device.uuid
	'clientId':customUUID
});
ga('send', 'pageview', {'page': '/started' , 'title': 'App Initialized' });

window.addEventListener('load', function() {
    FastClick.attach(document.body);
}, false);

var gfileSystem;

var appCurrency = '&#8358;';

var appLoadCount = 0;

var appLoad = true;

var videosLoad = true;

var appShowLoadingAnimation = false;

var activePage = true;

var tempCategoryHTML = new Array();

var storeBusinesses = new Array();

var activeBusinessView = 'all';

var firstBusinessID = new Array();
var lastBusinessID = new Array();
var currentIterationBusinessID = new Array();

var refreshBusinessListing = new Array();

var requestRetryCount = 0;

//var pagepointer = 'http://localhost/blubird/server/engine/';
//var pagepointer = 'http://192.168.1.7/blubird/server/engine/';
var pagepointer = 'http://blubird.maybeachtech.com/engine/';

var form_method = 'get';
var ajax_data_type = 'json';
var ajax_data = '';
var ajax_get_url = '';
var ajax_action = '';
var ajax_container;
var ajax_notice_container;
var ajax_request_md5_key = '';

//AJAX Request Data Before Sending
var ajax_request_data_before_sending_to_server = '';

var function_click_process = 1;

var cancel_ajax_recursive_function = false;

//BUSINESS LISTINGS QUERY LIMITS
var business_limit_start = new Array();
var business_limit_interval = 20;

//SEARCH QUERY LIMITS
var search_condition = '';
var search_limit_start = 0;
var search_limit_interval = 20;

var storeObjects = {};

function test_for_active_user(){
	if( customUUID ){
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			//registered
			//$('.app-user-name').text( 'Welcome ' + userInfo.name + '!' );
			
		}else{
			//signup
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
};
	
function cannot_initiate_app(){
	var settings = {
		message_title:'Cannot Initiate App',
		message_message: 'Please contact our customer care',
		auto_close: 'no'
	};
	clearData();
	display_popup_notice( settings );
};

function validate( $element , unfocused ){
	var tit = "Error Title";
	var msg = "Error Msg";
	var err = false;
	
	if( $element.attr('data-validate') && $element.attr('required') ){
		switch( $element.attr('data-validate') ){
		case 'text':
		case 'number':
		case 'tel':
			if( $element.val().length < 1 ){
				err = true;
			}
		break;
		case 'barcode':
			if( $element.val().length < 1 ){
				err = true;
			}
			var c = $element.val();
			if( c.charAt(0) == '0' ){
				err = true;
			}
		break;
		case 'email':
			var email = $element.val();
			var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
			if( email.length<1 || !emailReg.test( email ) ) {
				err = true;
			}
		break;
		case 'confirm-email':
			var email = $element.val();
			var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
			if( email.length<1 || !emailReg.test( email ) ) {
				err = true;
			}
			
			var $emails = $element.parents('form').find('input[type="email"]');
			if( $emails ){
				if( $emails.length > 1 ){
					$emails.each(function(){
						if( email != $(this).val() )err = true;
					});
				}else{
					if( email != $emails.val() )err = true;
				}
			}
		break;
		case 'password':
			if( $element.val().length < 6 ) {
				err = true;
			}
		break;
		case 'confirm-password':
			var pw = $element.val();
			var $pws = $element.parents('form').find('input[type="password"]');
			if( $pws ){
				if( $pws.length > 1 ) {
					$pws.each(function(){
						if( pw != $(this).val() )err = true;
					});
				}else{
					if( pw != $pws.val() )err = true;
				}
			}
		break;
		}
		
		if( err ){
			if( $element.attr('data-error-title') )tit = $element.attr('data-error-title');
			if( $element.attr('data-error-msg') )msg = $element.attr('data-error-msg');
			if( unfocused )$element.focus().select();
		}
	}
	
	var validated = {
		error: err,
		title: tit,
		message: msg,
	};
	return validated;
};

function transform_data( $form ){
	var data = $form.serializeArray();
	
	var error = {};
	var txData = { error:false };
	var unfocused = true;
	
	$.each( data , function( key , value ){
		var $input = $form.find('#'+value.name+'-field');
		if( $input ){
			if( $input.attr('data-validate') ){
				var validated = validate( $input , unfocused );
				
				if( ! ( error.error ) && validated.error ){
					//throw error & display message
					error = validated;
					unfocused = false;
				}else{
					//start storing object
					txData[ value.name ] = value.value;
				}
				
			}else{
				txData[ value.name ] = value.value;
			}
		}
	});
	
	if( error.error ){
		return error;
	}
	
	return txData;
};

var newSupplyID = 0;
var tempStoreObjects = {};
var tempDownloadObjects = {};

function store_record( data ){
	if( data.object ){
		var launch_date = new Date();
		var key = launch_date.getTime();
		
		var perm_storage = true;
		
		switch( data.object ){
		case 'inventory':
			//use barcode as key
			if( data.item_barcode )
				key = data.item_barcode;
			
			if( ! data.item_sold )data.item_sold = 0;
			if( ! data.income )data.income = 0;
			if( ! data.sales )data.sales = {};
			if( ! data.stock )data.stock = {};
			if( ! data.cost_price )data.cost_price = 0;
			if( ! data.selling_price )data.selling_price = 0;
			if( ! data.expiry_date )data.expiry_date = 0;
			if( ! data.item_qty )data.item_qty = 0;
			if( ! data.item_available )data.item_available = 0;
		break;
		case 'stock':
			if( ! newSupplyID ){
				var launch_date = new Date();
				newSupplyID = launch_date.getTime();
				newSupplyID++;
			}
			data.supply = newSupplyID;
			
			perm_storage = false;
		break;
		case 'supply':
			perm_storage = false;
		break;
		}
		
		var d = {};
		
		if( data.key ){
			key = data.key;
			var d = getData( key );
		}else{
			data.key = key;
		}
		
		
		data.timestamp = launch_date.getTime();
		if( d && d.creationtimestamp ){
			data.creationtimestamp = d.creationtimestamp;
		}else{
			data.creationtimestamp = data.timestamp;
		}
		
		if( d && d.id ){
			data.id = d.id;
		}
		//add details like = creation time, user etc.
		
		//perm storage
		if( perm_storage ){
			putData( key , data );
			
			//test if object is stored
			var test = getData( key );
			if( test.key && test.key == key ){
				
				var keys = getData( data.object );
				if( ! keys )var keys = {};
				keys[ key ] = key;
				putData( data.object , keys );
				
				//temp storage
				if( storeObjects[ data.object ] ){
					storeObjects[ data.object ][ test.key ] = test;
				}else{
					var d = {};
					d[ test.key ] = test;
					storeObjects[ data.object ] = d;
				}
				
				return test;
			}
		}else{
			tempStoreObjects[ key ] = data;
			return data;
		}
		//var s = amplify.store();
		//console.log('all',  s );
	}
};

function get_user_info(){
	if( storeObjects[ 'user_info' ] ){
		return storeObjects[ 'user_info' ];
	}
	
	if( customUUID ){
		storeObjects[ 'user_info' ] = getData( customUUID );
		return storeObjects[ 'user_info' ];
	}
	
	clearData();
};

function get_current_store_id(){
	if( storeObjects[ 'current_store_id' ] ){
		return storeObjects[ 'current_store_id' ];
	}
	
	var object = 'stores';
	var keys = getData( object );
	
	if( keys ){
		for (var key in keys ) break;
		storeObjects[ 'current_store_id' ] = key;
		return storeObjects[ 'current_store_id' ];
	}
};

var tempData = {};
function handle_form_submission( $form ){
	
	$form
	.on('submit', function( e ){
		e.preventDefault();
		
		//transform data
		var data = transform_data( $(this) );
		
		if( data.error ){
			//display error message
			var settings = {
				message_title:data.title,
				message_message: data.message,
				auto_close: 'no'
			};
			display_popup_notice( settings );
		}else{
			var local_store = 1;
			
			data[ 'object' ] = $(this).attr('name');
			
			if( $(this).attr('remote-storage') ){
				local_store = 0;
				post_form_data( $(this) );
				tempData = data;
			}
			
			if( local_store ){
				//store data
				var stored = store_record( data );
				successful_submit_action( stored );
				
				$form
				.find('input')
				.val('');
			}
		}
		
		return false;
	});
};

function post_form_data( $me ){
	ajax_data = $me.serialize();
	form_method = 'post';
	ajax_data_type = 'json';
	ajax_action = 'request_function_output';
	ajax_container = $('#login-form');
	ajax_get_url = $me.attr('action');
	ajax_send();
};

var newInventory = {};
var newStock = {};

function successful_submit_action( stored ){
	//console.log('stored', stored );
	var title = 'Saved!';
	var msg = 'Data successfully stored';
	
	switch( stored.object ){
	case 'suppliers':
		var suppliers_list = add_to_list_of_suppliers( stored );
		update_suppliers_list_on_suppliers_page();
		
		var upload = {};
		upload[ stored.key ] = stored.key;
		queueUpload( upload );
	break;
	case 'category':
		var category_list = add_to_list_of_category( stored );
		update_category_list_on_category_page();
		
		var upload = {};
		upload[ stored.key ] = stored.key;
		queueUpload( upload );
	break;
	case 'app_usersHOLD':
		var users_list = add_to_list_of_users( stored );
		update_users_list_on_users_page();
			
		var upload = {};
		upload[ stored.key ] = stored.key;
		
		if( stored.stores ){
			stores = getData( stored.stores );
			if( stores.key ){
				if( ! stores.users )stores.users = {};
				
				stores.users[ stored.key ] = stored.key;
				putData( stores.key , stores );
				
				add_to_list_of_stores( stores );
				
				upload[ stores.key ] = stores.key;
			}
		}
		
		queueUpload( upload );
	break;
	case 'stores':
		var stores_list = add_to_list_of_stores( stored );
		update_stores_list_on_stores_page();
		
		var upload = {};
		upload[ stored.key ] = stored.key;
		queueUpload( upload );
	break;
	case 'sign-up':
		if( stored.creationtimestamp && stored.creationtimestamp != stored.timestamp ){
			storeObjects[ 'user_info' ] = stored;
		}else{
			title = 'Welcome!';
			msg = 'Thank you for choosing blubird';
			
			//create default store record
			var store = {
				name: 'My Store',
				street:'',
				city:'',
				state:'',
				country:'',
				object:'stores',
				users: {}
			};
			
			stores = store_record( store );
			console.log('store', stores);
			
			var stores_list = add_to_list_of_stores( stores );
			
			var upload = {};
			upload[ stores.key ] = stores.key;
			queueUpload( upload );
			
			$.mobile.navigate( "#dashboard", { transition : "none" });
		}
	break;
	case 'inventory':
		//add - ! (item desc | barcode | cateogry | location ) to stock_level object 
		title = 'Stored!';
		msg = 'Inventory successfully created';
		
		add_to_list_of_inventory( stored );
		update_inventory_list_on_inventory_page();
		
		var upload = {};
		upload[ stored.key ] = stored.key;
		queueUpload( upload );
	break;	
	case 'stock':
		//add - ! (item desc | barcode | cateogry | location ) to stock_level object 
		title = 'Stocked!';
		msg = '';
		
		if( stored.supplier ){
			if( tempStoreObjects[ stored.supplier ] ){
				var supplier = tempStoreObjects[ stored.supplier ];
			}else{
				var supplier = getData( stored.supplier );
			}
			
			if( supplier && typeof supplier === 'object' ){
				if( tempStoreObjects[ stored.item_barcode ] ){
					var inventory = tempStoreObjects[ stored.item_barcode ];
				}else{
					var inventory = getData( stored.item_barcode );
				}
				
				if( inventory ){
					inventory.cost_price = stored.cost_price;
					inventory.selling_price = stored.selling_price;
					inventory.expiry_date = stored.expiry_date;
					
					if( ! inventory.item_qty )inventory.item_qty = 0;
					inventory.item_qty = parseFloat(inventory.item_qty) + parseFloat( stored.item_qty );
					inventory.item_available = inventory.item_qty - inventory.item_sold;
					
					if( ! inventory.stock ){
						inventory.stock = {};
					}
					inventory.stock[ stored.key ] = stored.key;
					
					tempStoreObjects[ inventory.key ] = inventory;
					//putData( inventory.key , inventory );
					
					
					if( supplier.stock && typeof supplier.stock === 'object' ){
						var supplier_stock = supplier.stock;
					}else{
						supplier.stock = {};
						var supplier_stock = {};
					}
					supplier_stock[ stored.key ] = stored.key;
					supplier.stock = supplier_stock;
					
					tempStoreObjects[ supplier.key ] = supplier;
					//putData( stored.supplier , supplier );
					
					/*perform on save operation
					if( ! storeObjects[ 'suppliers_list' ] ){
						storeObjects[ 'suppliers_list' ] = {};
					}
					
					storeObjects[ 'suppliers_list' ][ stored.supplier ] = supplier;
					*/
					
					if( ! newStock.total_amount ){
						newStock.total_items = 0;
						newStock.total_amount = 0;
						newStock.total_amount_paid = 0;
					}
					
					newStock.key = stored.supply;
					
					newStock.total_items += parseFloat( stored.item_qty );
					newStock.total_amount += ( stored.cost_price * stored.item_qty );
					newStock.total_amount_paid = 0;
					
					updateSupplyFormFields( newStock );
				}
			}else{
				//delete stored data
				delete tempStoreObjects[ stored.key ];
				
				title = 'Invalid Supplier!';
				msg = 'Please select a supplier or create one if none exists';
			}
		}
		console.log('tempDataStore', tempStoreObjects);
	break;
	case 'supply':
		if( newStock && Object.getOwnPropertyNames(newStock).length && tempStoreObjects && Object.getOwnPropertyNames(tempStoreObjects).length ){
			
			stored.total_amount = parseFloat( stored.total_amount );
			stored.total_amount_paid = parseFloat( stored.total_amount_paid );
			
			var amount_owed = stored.total_amount - stored.total_amount_paid;
			
			var obj = {};
			var uploadData = {};
			
			if( ! storeObjects[ 'inventory_list' ] ){
				storeObjects[ 'inventory_list' ] = {};
			}
			if( ! storeObjects[ 'suppliers_list' ] ){
				storeObjects[ 'suppliers_list' ] = {};
			}
			
			//store temp object
			$.each( tempStoreObjects, function ( key , val ){
				uploadData[ key ] = key;
				putData( key , val );
				if( val.object ){
					if( ! obj[ val.object ] ){
						obj[ val.object ] = getData( val.object );
					}
					
					if( ! obj[ val.object ] ){
						obj[ val.object ] = {};
					}
					obj[ val.object ][ key ] = key;
					
					switch( val.object ){
					case 'inventory':
						storeObjects[ 'inventory_list' ][ key ] = val;
					break;
					case 'supplier':
						storeObjects[ 'suppliers_list' ][ key ] = val;
					break;
					}
				}
			});
			
			
			$.each( obj, function ( key , val ){
				putData( key , val );
			});
			
			title = 'Your inventory has been updated!';
			msg = "\nTotal Items: " + stored.total_items + "\nTotal Cost: " + formatNum( stored.total_amount.toFixed(2) ) + "\n\nTotal Amount Paid: " + formatNum( stored.total_amount_paid.toFixed(2) ) + " \nAmount Owed: " + formatNum( amount_owed.toFixed(2) );
				
			//yes - move newly added items to uploader object & clear new
			queueUpload( uploadData );
			tempStoreObjects = {};
			newStock = {};
			uploadData = {};
		}else{
			delete tempStoreObjects[ stored.key ];
			
			title = 'No Items were Supplied!';
			msg = 'Please add items to stock first';
		}
	break;
	case 'sales':
		var newSale = {};
		$.each( stored.inventory , function( key , value ){
			var inventory = getData( key );
			/*might be remove*/
			if( inventory ){
			
			if( inventory.item_sold ){
				inventory.item_sold += value.unit_ordered;
				inventory.income += value.unit_selling_price;
			}else{
				inventory.item_sold = value.unit_ordered;
				inventory.income = value.unit_selling_price;
			}
			
			if( inventory.sales ){
				inventory.sales[ stored.key ] = stored.key;
			}else{
				inventory.sales = {};
				inventory.sales[ stored.key ] = stored.key;
			}
			
			putData( key , inventory );
			
			storeObjects[ 'inventory_list' ][ key ] = inventory;
			
			newSale[ inventory.key ] = inventory.key;
			}
		});
		
		newSale[ stored.key ] = stored.key;
		queueUpload( newSale );
		//storeObjects[ 'sales' ][ stored.key ] = stored;
		
		title = 'Sold!';
		msg = 'Sale was successful';
	break;
	}
	
	var settings = {
		message_title:title,
		message_message: msg,
		auto_close: 'yes'
	};
	display_popup_notice( settings );
};

function add_to_list_of_suppliers( data ){
	if( storeObjects[ 'suppliers_list' ] ){
		storeObjects[ 'suppliers_list' ];
	}else{
		get_list_of_suppliers();
	}
	
	storeObjects[ 'suppliers_list' ][ data.key ] = data;
	
	$( '#suppliers-list-container' )
	.find('#'+data.key)
	.remove();
	
	$( '#suppliers-list-container' )
	.prepend( get_supplier_html( data.key , data ) );
};

function add_to_list_of_category( data ){
	if( storeObjects[ 'category_list' ] ){
		storeObjects[ 'category_list' ];
	}else{
		get_list_of_category();
	}
	
	storeObjects[ 'category_list' ][ data.key ] = data;
	
	$( '#category-list-container' )
	.find('#'+data.key)
	.remove();
	
	$( '#category-list-container' )
	.prepend( get_category_html( data.key , data ) );
};

function add_to_list_of_users( data ){
	if( storeObjects[ 'users_list' ] ){
		storeObjects[ 'users_list' ];
	}else{
		get_list_of_users();
	}
	
	storeObjects[ 'users_list' ][ data.key ] = data;
	
	$( '#users-list-container' )
	.find('#'+data.key)
	.remove();
	
	$( '#users-list-container' )
	.prepend( get_users_html( data.key , data ) );
};

function add_to_list_of_stores( data ){
	if( storeObjects[ 'stores_list' ] ){
		storeObjects[ 'stores_list' ];
	}else{
		get_list_of_stores();
	}
	
	storeObjects[ 'stores_list' ][ data.key ] = data;
	
	$( '#stores-list-container' )
	.find('#'+data.key)
	.remove();
	
	$( '#stores-list-container' )
	.prepend( get_stores_html( data.key , data ) );
};

function add_to_list_of_inventory( data ){
	if( storeObjects[ 'inventory_list' ] ){
		storeObjects[ 'inventory_list' ];
	}else{
		get_list_of_inventory();
	}
	
	storeObjects[ 'inventory_list' ][ data.key ] = data;
};

function get_list_of_suppliers(){
	if( storeObjects[ 'suppliers_list' ] ){
		storeObjects[ 'suppliers_list' ];
	}else{
		var object = 'suppliers';
		var keys = getData( object );
		var suppliers_list = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				suppliers_list[ key ] = getData( key );
			});
		}
		
		storeObjects[ 'suppliers_list' ] = suppliers_list;
		
	}
	return storeObjects[ 'suppliers_list' ];
};

function get_list_of_category(){
	if( storeObjects[ 'category_list' ] ){
		storeObjects[ 'category_list' ];
	}else{
		var object = 'category';
		var keys = getData( object );
		var category_list = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				category_list[ key ] = getData( key );
			});
		}
		
		storeObjects[ 'category_list' ] = category_list;
		
	}
	return storeObjects[ 'category_list' ];
};

function get_list_of_users(){
	if( storeObjects[ 'users_list' ] ){
		storeObjects[ 'users_list' ];
	}else{
		var object = 'app_users';
		var keys = getData( object );
		var users_list = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				users_list[ key ] = getData( key );
			});
		}
		
		storeObjects[ 'users_list' ] = users_list;
		
	}
	return storeObjects[ 'users_list' ];
};

function get_list_of_stores(){
	if( storeObjects[ 'stores_list' ] ){
		storeObjects[ 'stores_list' ];
	}else{
		var object = 'stores';
		var keys = getData( object );
		var stores_list = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				stores_list[ key ] = getData( key );
			});
		}
		
		storeObjects[ 'stores_list' ] = stores_list;
		
	}
	return storeObjects[ 'stores_list' ];
};

function get_list_of_inventory(){
	if( storeObjects[ 'inventory_list' ] ){
		storeObjects[ 'inventory_list' ];
	}else{
		var object = 'inventory';
		var keys = getData( object );
		var inventory_list = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				inventory_list[ key ] = getData( key );
				/*
				inventory_list[ key ].total_qty = 0;
				if( inventory_list[ key ].stock ){
					$.each( inventory_list[ key ].stock , function( k , v ){
						var stock = getData( k );
						inventory_list[ key ].total_qty += parseFloat( stock.item_qty );
					} );
				}
				*/
			});
			
		}
		
		storeObjects[ 'inventory_list' ] = inventory_list;
	}
	return storeObjects[ 'inventory_list' ];
};

function get_sales(){
	if( storeObjects[ 'sales' ] ){
		storeObjects[ 'sales' ];
	}else{
		var object = 'sales';
		var keys = getData( object );
		var sales = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				sales[ key ] = getData( key );
				if( sales[ key ].timestamp ){
					sales[ key ].timestamp = parseFloat( sales[ key ].timestamp );
				}
				/*
				inventory_list[ key ].total_qty = 0;
				if( inventory_list[ key ].stock ){
					$.each( inventory_list[ key ].stock , function( k , v ){
						var stock = getData( k );
						inventory_list[ key ].total_qty += parseFloat( stock.item_qty );
					} );
				}
				*/
			});
			
		}
		
		storeObjects[ 'sales' ] = sales;
	}
	
	return storeObjects[ 'sales' ];
};

function get_inventory_html( key , value ){
	
	if( ! value.selling_price ){
		value.selling_price = 0;
	}
	
	var qty = 0;
	if(  value.item_qty )qty = parseFloat( value.item_qty );
	if(  value.item_sold )qty -= parseFloat( value.item_sold );
	
	var html = '<tr id="'+key+'" class="'+value.category.replace(' ', '-')+'" timestamp="'+value.timestamp+'"><td><img src="image bank/Coca Cola - 50cl.jpg" class="ui-li-thumb"></td><td>'+value.item_desc+'</td><td>'+formatNum( qty )+'</td><td>'+formatNum( value.selling_price )+'</td><td >';
	
	if( value.supplier ){
		html += '<a href="tel:+23408183140303" data-role="button" data-mini="true" data-theme="a" data-icon="phone" class="ui-link ui-btn ui-btn-a ui-icon-phone ui-btn-icon-left ui-shadow ui-corner-all ui-mini"><b>Mrs Ateke</b></a>';
	}
	
	html += '</td></tr>';
	
	return html;
};

var months_of_year = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function get_new_inventory_html( key , value ){
	var date = new Date( value.timestamp );
	
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
		
	return '<tr id="'+key+'" class="'+value.category.replace(' ', '-')+'" timestamp="'+value.timestamp+'"><td><img src="image bank/Coca Cola - 50cl.jpg" class="ui-li-thumb"></td><td>'+value.item_desc+'</td><td>'+year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes+'</td></tr>';
};

function get_inventory_set_pricing_html( key , value ){
	if( ! value.cost_price )cp  = 0;
	else cp = parseFloat( value.cost_price );
	
	var qty = 0;
	if(  value.item_qty )qty = parseFloat( value.item_qty );
	if(  value.item_sold )qty -= parseFloat( value.item_sold );
	
	return '<tr id="'+key+'" class="'+value.category.replace(' ', '-')+'" timestamp="'+value.timestamp+'"><td><img src="image bank/Coca Cola - 50cl.jpg" class="ui-li-thumb"></td><td>'+value.item_desc+'</td><td>'+formatNum( qty )+'</td><td>'+formatNum( cp.toFixed(2) )+'</td><td><div class="ui-input-text ui-body-inherit ui-corner-all ui-shadow-inset"><input type="number" min="0" step="any" value="'+value.selling_price+'" default-value="'+value.selling_price+'" item="'+value.item_desc+'" class="inventory-pricing-input" key="'+key+'" cost-price="'+value.cost_price+'" /></div></td></tr>';
};

function get_supplier_html( key , value ){
	var date = new Date( value.timestamp );
	
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	
	return '<tr id="'+key+'" timestamp="'+value.timestamp+'"><td>'+value.supplier+' ('+value.location+')</td><td>'+year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes+'</td></tr>';
};

function get_category_html( key , value ){
	var date = new Date( value.timestamp );
	
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	
	return '<tr id="'+key+'" timestamp="'+value.timestamp+'"><td>'+value.category+'</td><td>'+year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes+'</td></tr>';
};

function get_users_html( key , value ){
	var date = new Date( value.timestamp );
	
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	
	return '<tr id="'+key+'" timestamp="'+value.timestamp+'"><td>'+value.name+'</td><td>'+value.email+'</td><td>'+year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes+'</td></tr>';
};

function get_stores_html( key , value ){
	var date = new Date( value.timestamp );
	
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	
	if( minutes < 10 ){
		minutes = '0'+''+minutes;
	}
	return '<tr id="'+key+'" timestamp="'+value.timestamp+'"><td>'+value.name+'</td><td>'+value.user+'</td><td>'+year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes+'</td></tr>';
};

$( document ).on( "pagecreate", "#dashboard", function() {
	test_for_active_user();
});

$( document ).on( "pageshow", "#dashboard", function() {
	
	var inventory = get_list_of_inventory();
	
	var label = new Array();
	var values1 = new Array();
	var values2 = new Array();
	var i = 0;
	
	var total_value = 0;
	var total_items = 0;
	
	$.each( inventory , function( key , value ){
		if( ! value.item_sold )value.item_sold = 0;
		if( ! value.item_qty )value.item_qty = 0;
		if( ! value.selling_price )value.selling_price = 0;
		
		total_value += ( parseFloat( value.item_qty ) - parseFloat( value.item_sold ) )* value.selling_price;
		total_items += ( parseFloat( value.item_qty ) - parseFloat( value.item_sold ) );
		
		label[i] = value.item_desc;
		values2[i] = value.item_qty;
		values1[i] = value.item_sold;
		++i;
	});
	
	if( label && values1 && values2 && i ){
		var data = {};
		data.label = label;
		data.value1 = values1;
		data.value2 = values2;
		data.id = 'chart5';
		data.axislabel = new Array();
		data.axislabel[0] = {label:'Quantity Sold'};
		data.axislabel[1] = {label:'Remaining Stock'};
		
		activate_bar_chart( data );
	}
	
	$('.total-value-of-inventory')
	.html( appCurrency + formatNum(total_value.toFixed(2) ) );
	
	$('.total-items-in-stock')
	.html( formatNum( total_items ) );
	
	$('.total-unique-inventory-items')
	.html( '('+formatNum( i )+')' );
	
	var sales = get_sales();
	var total_value = 0;
	var total_items = 0;
	var total_cost_price = 0;
	var total_vat = 0;
	
	var date = new Date();
	var today = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
	var today_total_days = 0;
	var today_cost_price_days = 0;
	
	var today_units = 0;
	
	var most_selling = new Array();
	
	$.each( sales , function( key , value ){
		if( value.subtotal )total_value += parseFloat( value.subtotal );
		if( value.vat )total_vat += parseFloat( value.vat );
		
		if( value.total_units )total_items += parseFloat( value.total_units );
		if( value.total_cost_price )total_cost_price += parseFloat( value.total_cost_price );
		
		var date = new Date(value.timestamp);
		// hours part from the timestamp
		var day = date.getDate();
		var month = date.getMonth() + 1;
		var year = date.getFullYear();
		
		value.day = year + '-' + month + '-' + day;
		
		if( value.day == today ){
			today_total_days += parseFloat( value.total_amount );
			today_cost_price_days += parseFloat( value.total_cost_price );
			if( value.total_units )today_units += parseFloat( value.total_units );
			
			$.each( value.inventory , function( k, v){
				if( inventory[k] ){
					if( most_selling[ k ] ){
						var  ini = most_selling[ k ];
						most_selling[ k ] = {
							units: parseFloat( v.unit_ordered ) + ini.units,
							total_amount: parseFloat( v.unit_ordered * v.unit_selling_price ) + ini.total_amount,
							id: k,
							item_desc: inventory[k].item_desc
						}
					}else{
						most_selling[ k ] = {
							units: parseFloat( v.unit_ordered ),
							total_amount: parseFloat( v.unit_ordered * v.unit_selling_price ),
							id: k,
							item_desc: inventory[k].item_desc
						}
					}
				}
			});
		}
		
	});
	
	$('.today-total-sales-amount')
	.html( appCurrency + formatNum(today_total_days.toFixed(2) ) );
	
	$('.today-total-sales-units')
	.html( '('+formatNum( today_units )+')' );
	
	$('.total-sales-amount')
	.html( appCurrency + formatNum(total_value.toFixed(2) ) );
	
	$('.total-sales-tax')
	.html( appCurrency + formatNum(total_vat.toFixed(2) ) );
	
	$('.total-sales-units')
	.html( formatNum( total_items ) );
	
	var profit = total_value - total_cost_price;
	var today_profit = today_total_days - today_cost_price_days;
	
	$('.today-gross-profit')
	.html( appCurrency + formatNum(today_profit.toFixed(2) ) );
	
	if( total_value ){
		most_selling.sort(function(a,b){
			return b.units - a.units;
		});
		
		var j = 5;
		if( most_selling.length < j ){
			j = most_selling.length;
		}
		
		if( j ){
			var dtset = new Array();
			var i = 0;
			for( i = 0; i < j; i++){
				if( most_selling[i] ){
					dtset[ i ] = [ most_selling[i].item_desc + ' ('+most_selling[i].units+')' , most_selling[i].total_amount ];
				}
			}
			
			var data = {
				id:'#chart1',
				dataset: dtset,
			};
			piechart( data );
		}
	}
	
	
});

$( document ).on( "pagecreate", "#records", function() {
	$('#popupRecords')
	.on( "popupafteropen", function( event, ui ) {
		if( $(this).data('key') ){
		
			var key = $(this).data('key');
			var sales_data = getData( key );
			
			var html = '';
			
			if( sales_data.inventory ){
				$.each( sales_data.inventory , function( k , s ){
					var inventory = getData( k );
					
					html += get_item_row_for_sales_records( s , inventory );
				});
				
				$(this)
				.find('#sales-record-sub-total')
				.html( formatNum(sales_data.subtotal.toFixed(2)) );
				
				$(this)
				.find('#sales-record-vat')
				.html( formatNum(sales_data.vat.toFixed(2)) );
				
				$(this)
				.find('#sales-record-total')
				.add( '#sales-record-total-1' )
				.html( formatNum(sales_data.total_amount.toFixed(2)) );
				
				var change = sales_data.total_amount_tendered - sales_data.total_amount;
				$(this)
				.find('#sales-record-change')
				.html( formatNum(change.toFixed(2)) );
				
				$(this)
				.find('#sales-record-amount-paid')
				.html( formatNum(sales_data.total_amount_tendered.toFixed(2)) );
				
				//sales-record-discount
				
			}else{
				//display no inventory msg
			}
			
		}else{
			//invalid sales id msg
		}
		
		$('#sales-record-pop-container')
		.html( html );
	});
	
	$('.sales-records-details-toggle')
	.on('click', function(){
		$('tfoot.details-hide')
		.removeClass('details-hide');
		
		$(this)
		.parents('tfoot')
		.addClass('details-hide');
	});
});

function get_item_row_for_sales_records_summary( s ){
	return '<tr><td><b>'+s.label+'</b></td><td><b>'+s.value+'</b></td></tr>';
};

function get_item_row_for_sales_records( s , v ){
	var a = s.unit_ordered*s.unit_selling_price;
	
	var desc = '';
	if( v &&  v.item_desc )desc = v.item_desc;
	else desc = 'product no longer exists';
	
	return '<tr><td>'+desc+'<b>&nbsp;('+s.unit_ordered+')</b></td><td><b>'+formatNum(a.toFixed(2))+'</b></td></tr>';
};

$( document ).on( "pageshow", "#records", function() {
	
	var sales = get_sales();
	var total_value = 0;
	var total_items = 0;
	var total_cost_price = 0;
	var total_vat = 0;
	
	var date = new Date();
	var today = date.getFullYear() + '-' + months_of_year[ date.getMonth() ] + '-' + date.getDate();
	var this_month = date.getFullYear() + '-' + months_of_year[ date.getMonth() ];
	var this_year = date.getFullYear();
	var this_week = date.getDay();
	
	var current_timestamp = date.getTime();
	var one_day = current_timestamp - (24*3600000);
	var two_day = current_timestamp - (48*3600000);
	var three_day = current_timestamp - (72*3600000);
		
	var today_html_days = '';
	var today_html_months = '';
	var today_html_years = '';
	
	var one_day_html = '';
	var two_day_html = '';
	
	var one_day_total = 0;
	var two_day_total = 0;
	
	var today_total_days = 0;
	var today_total_months = 0;
	var today_total_years = 0;
	
	var weekdays = new Array();
	weekdays = [ 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat' ];
	
	
	$.each( sales , function( key , value ){
		var date = new Date( value.timestamp );
		// hours part from the timestamp
		var day = date.getDate();
		var month = date.getMonth();
		var year = date.getFullYear();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
		
		value.day_only = day;
		value.week_day = weekdays[ date.getDay() ];
		
		value.day = year + '-' + months_of_year[ month ] + '-' + day;
		value.time = hours + ':' + minutes;
		
		if( value.day == today ){
			today_html_days += get_sales_records_html( value , 0 );
			today_total_days += parseFloat( value.total_amount );
		}
		console.log(value.timestamp +'<'+ current_timestamp +'&&'+ value.timestamp +'>'+ one_day);
		if( value.timestamp < one_day && value.timestamp > two_day ){
			one_day_html += get_sales_records_html( value , 0 );
			one_day_total += parseFloat( value.total_amount );
		}
		
		if( value.timestamp < two_day && value.timestamp > three_day ){
			two_day_html += get_sales_records_html( value , 1 );
			two_day_total += parseFloat( value.total_amount );
		}
		
		if( this_month == year + '-' + months_of_year[ month ] ){
			today_html_months += get_sales_records_html( value , 1 );
			today_total_months += parseFloat( value.total_amount );
		}
		
	});
	
	$('#today-sales-records-days-total')
	.html( appCurrency + formatNum( today_total_days.toFixed(2) ) );
	
	$('#today-sales-records-months-total')
	.html( appCurrency + formatNum( today_total_months.toFixed(2) ) );
	
	$('#two-day-sales-total')
	.html( appCurrency + formatNum( two_day_total.toFixed(2) ) );
	
	$('#one-day-sales-total')
	.html( appCurrency + formatNum( one_day_total.toFixed(2) ) );
	
	if( one_day_html ){
		$('#one-day-records')
		.html( '<ul data-role="listview" >'+one_day_html+'</ul>' )
		.trigger('create');
	}
	
	if( two_day_html ){
		$('#two-day-records')
		.html( '<ul data-role="listview" >'+two_day_html+'</ul>' )
		.trigger('create');
	}
	
	$('#today-sales-records-months')
	.html( '<ul data-role="listview" >'+today_html_months+'</ul>' )
	.trigger('create');
	
	$('#today-sales-records')
	.html( '<ul data-role="listview" >'+today_html_days +'</ul>')
	.trigger('create');
	
	$('#sales-records-container')
	.find('a.sales-reccord')
	.on('click', function(e){
		e.preventDefault();
		
		$('#popupRecords')
		.data( 'key' , $(this).attr('key') )
		.popup('open');
	});
	
});

function get_sales_records_html( data , format ){
	var date = '';
	if( format ){
		date = data.day_only+'/'+data.week_day+' ';
	}
	if( ! parseFloat( data.total_amount ) ){
		data.total_amount = 0;
	}
	return '<li><a href="#" key="'+data.key+'" class="sales-reccord" style="font-weight: normal;">#'+data.key+' @ '+date+data.time+' <b>'+ formatNum( data.total_amount.toFixed(2) ) +'</b></a></li>';
};

function update_suppliers_list_on_suppliers_page(){
	var suppliers = get_list_of_suppliers();
	var html = '';
	var html2 = '<option value="new">Add New Supplier</option>';
	
	$.each( suppliers , function( key , value ){
		html += get_supplier_html( key , value );
		html2 += '<option value="'+key+'">'+value.supplier+' ('+value.location+')</option>';
	});
	
	$( '#suppliers-list-container' )
	.html( html )
	.find('tr')
	.tsort({attr:'timestamp', order:'desc'});
	
	$('select[name="supplier"]')
	.html( html2 );
	/*
	.prev('span')
	.text( $('select[name="supplier"]').find('option:first').text() );*/
	
	$('select[name="supplier"]')
	.find('option')
	.tsort();
};

function update_category_list_on_category_page(){
	var category = get_list_of_category();
	var html = '';
	var html2 = '<option value="new"> - New Category - </option>';
	
	$.each( category , function( key , value ){
		html += get_category_html( key , value );
		html2 += '<option value="'+key+'">'+value.category+'</option>';
	});
	
	$( '#category-list-container' )
	.html( html )
	.find('tr')
	.tsort({attr:'timestamp', order:'desc'});
	
	$('#category-select-box')
	.html( html2 );
	/*
	.prev('span')
	.text( $('select[name="category"]').find('option:first').text() );*/
	
	$('#category-select-box')
	.find('option')
	.tsort();
};

function update_users_list_on_users_page(){
	var category = get_list_of_users();
	var html = '';
	var html2 = '<option value="new"> - New User - </option>';
	
	$.each( category , function( key , value ){
		html += get_users_html( key , value );
		html2 += '<option value="'+key+'">'+value.name+' ('+value.email+')</option>';
	});
	
	$( '#users-list-container' )
	.html( html )
	.find('tr')
	.tsort({attr:'timestamp', order:'desc'});
	
	$('#users-select-box')
	.html( html2 );
	/*
	.prev('span')
	.text( $('select[name="category"]').find('option:first').text() );*/
	
	$('#users-select-box')
	.find('option')
	.tsort();
};

function update_stores_list_on_stores_page(){
	var category = get_list_of_stores();
	var html = '';
	var html2 = '<option value="new"> - New Store - </option>';
	
	var user = {};
	$.each( category , function( key , value ){
		if( value.users ){
			if( ! value.user ){
				$.each( value.users , function( k , v ){
					if( ! user[k] ){
						user[k] = getData( k );
					}
					
					if( value.user ){
						value.user += ', ' + user[k].name;
					}else{
						value.user = user[k].name;
					}
				});
			}
		}
		
		html += get_stores_html( key , value );
		html2 += '<option value="'+key+'">'+value.name+'</option>';
	});
	
	
	$( '#stores-list-container' )
	.html( html )
	.find('tr')
	.tsort({attr:'timestamp', order:'desc'});
	
	$('#stores-select-box')
	.html( html2 );
	
	$('#stores-select-box')
	.find('option')
	.tsort();
};

function update_inventory_list_on_inventory_page(){
	var inventory = get_list_of_inventory();
	var html = '';
	var html2 = '<option value="new"> - Select Item - </option>';

	$.each( inventory , function( key , value ){
		if( value ){
			html += get_new_inventory_html( key , value );
			html2 += '<option value="'+key+'">'+value.item_desc+'</option>';
		}
	});
	
	if( html ){
		$('#item-select-field')
		.html( html2 )
		.find('option')
		.tsort();
		
		$( 'tbody#newly-listed-inventory-container' )
		.html( html )
		.find('tr')
		.tsort({attr:'timestamp', order:'desc'});
	}
};

$( document ).on( "pagecreate", "#signup", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			//registered
			$.mobile.navigate( "#viewAndModifyUserDetails-page", { transition : "none" });
		}else{
			//bind events handlers
			handle_form_submission( $('form#sign-up-form') );
		}
		
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pagecreate", "#login", function() {
	if( customUUID ){
		//bind events handlers
		handle_form_submission( $('form#login-form') );
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pagecreate", "#supplier", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			//registered
			handle_form_submission( $('form#suppliers-form') );
			
			//Display List of Suppliers
			update_suppliers_list_on_suppliers_page();
			
			$('#supplier-select-box')
			.on('change', function(){
				var val = $(this).val();
				if( val && val != 'new' ){
					var supplier = getData( val );
					
					$.each( supplier, function(key , value ){
						$('form#suppliers-form')
						.find('#'+key+'-field')
						.val( value );
					});
					
					$('#suppliers-form #mobile-field').blur();
					$( '#suppliers-form #email-field' ).blur();
					
					var total_amount_paid = 0;
					var total_amount = 0;
					var total_amount_owed = 0;
					var supply = {};
					//recent supply activity
					var html = '';
					if( supplier.stock ){
						$.each( supplier.stock , function( k , v ){
							var stock = getData( k );
							if( stock ){
								var item = getData( stock.item_barcode );
								stock.item_desc = item.item_desc;
								html += get_last_supply_activity_html( stock );
								
								if( ! supply[ stock.supply ] ){
									supply[ stock.supply ] = getData( stock.supply );
								}
							}
						});
					}
					
					
					$.each( supply , function( key , val ){
						var a = parseFloat( val.total_amount );
						if( ! a )a = 0;
						total_amount += a;
						
						var b = parseFloat( val.total_amount_paid );
						if( ! b )b = 0;
						total_amount_paid += b;
					});
					
					if( total_amount )
						total_amount_owed = total_amount - total_amount_paid;
					
					$('#supplier-amount-owed')
					.html( appCurrency + formatNum( total_amount_owed.toFixed(2) ) );
					
					$('#last-supply-activity-supplier-name')
					.html( supplier.supplier );
					
					$('#last-supply-activity-container')
					.html( html )
					.find('tr')
					.tsort({attr:'timestamp', order:'desc'});
					
				}else{
					$('form#suppliers-form')
					.find('input')
					.val('');
				}
			});
			
			
			$('#suppliers-form #mobile-field')
			.add( '#suppliers-form #email-field' )
			.on('blur', function(){
				$('#'+$(this).attr('id')+'-link')
				.attr('href', $(this).attr('protocol')+$(this).val() );
			});
		}else{
			//bind events handlers
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pagecreate", "#mngcategory", function() {
	test_for_active_user();
	
	//registered
	handle_form_submission( $('form#category-form') );
	
	//Display List of Suppliers
	update_category_list_on_category_page();
	
	activate_record_delete_button();
	activate_upload_queue_button();
	
	$('#category-select-box')
	.on('change', function(){
		var val = $(this).val();
		if( val && val != 'new' ){
			var category = getData( val );
			
			$.each( category, function(key , value ){
				$('form#category-form')
				.find('#'+key+'-field')
				.val( value );
			});
			
			$('form#category-form')
			.find('.delete-record')
			.attr({
				key: category.key,
				object: category.object,
			});
		}else{
			$('form#category-form')
			.find('input')
			.val('');
		}
	});
});

$( document ).on( "pageshow", "#mngusers", function() {
	$('input[name="app_uid"]')
	.val( customUUID );
	
	populate_stores_select_box( $('#app_users-form').find('select[name="stores"]') );
});

$( document ).on( "pagecreate", "#mngusers", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			//registered
			handle_form_submission( $('form#app_users-form') );
			
			//Display List of Suppliers
			update_users_list_on_users_page();
			activate_record_delete_button();
			
			activate_upload_queue_button();
			
			$('#users-select-box')
			.on('change', function(){
				var val = $(this).val();
				if( val && val != 'new' ){
					var category = getData( val );
					
					$.each( category, function(key , value ){
						$('form#app_users-form')
						.find('#'+key+'-field')
						.val( value );
					});
					
					$('form#app_users-form')
					.find('.delete-record')
					.attr({
						key: category.key,
						object: category.object,
					});
				}else{
					$('form#app_users-form')
					.find('input')
					.val('');
					
					$('form#app_users-form')
					.find('.delete-record')
					.attr({
						key: '',
						object: '',
					});
				}
			});
		}else{
			//bind events handlers
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pagecreate", "#stores", function() {
	test_for_active_user();
	get_dynamic_categories();
	handle_form_submission( $('form#stores-form') );
	
	$('#stores-select-box')
	.on('change', function(){
		var val = $(this).val();
		if( val && val != 'new' ){
			var category = getData( val );
			
			$.each( category, function(key , value ){
				$('form#stores-form')
				.find('#'+key+'-field')
				.val( value );
			});
			
		}else{
			$('form#stores-form')
			.find('input')
			.val('');
		}
	});
		
});

$( document ).on( "pageshow", "#stores", function() {
	update_stores_list_on_stores_page();
});

$( document ).on( "pagecreate", "#settings", function() {
	test_for_active_user();
	
	handle_form_submission( $('form#sign-up-form') );
	
	$('#export-data')
	.on('click', function(){
		var ajax_data = amplify.store();
		
		$.ajax({
			dataType:"json",
			type:"POST",
			data:ajax_data,
			url: 'http://blubird.maybeachtech.com/data.php',
			timeout:30000,
			beforeSend:function(){
				
			},
			error: function() {
				alert('Data Export Failed');
			},
			success: function(){
				alert('Data Export Successful');
			}
		});
	});
	
	$('#sign-out')
	.on('click', function(){
		clearData();
		$.mobile.navigate( "#signup", { transition : "none" });
	});
});

$( document ).on( "pageshow", "#settings", function() {
	//check for registered user details
	var userInfo = get_user_info();
	
	$.each( userInfo , function( k , v ){
		switch( k ){
		default:
			$('form#sign-up-form')
			.find('#'+k+'-field')
			.val( v );
		break;
		}
	} );
	
});

function get_last_supply_activity_html( stock ){
	var date = new Date(stock.creationtimestamp);
	// hours part from the timestamp
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	stock.date = year+'-'+months_of_year[ month ]+'-'+day;
	
	return '<tr timestamp="'+stock.creationtimestamp+'"><td><img src="image bank/Coca Cola - 50cl.jpg" class="ui-li-thumb"></td><td>'+stock.item_desc+'</td><td>'+stock.item_qty+'</td><td>'+stock.date+'</td></tr>';
	
};

$( document ).on( "pagecreate", "#newInventory", function() {
	test_for_active_user();
	
	$('a.button-scan')
	.on('click', function(){
		cordova.plugins.barcodeScanner.scan(
		  function (result) {
			 $('form#inventory-form')
			.find( 'input#item_barcode-field' )
			.val( result.text );
			
			 alert( "Barcode: " + result.text + "\n" +
					"Format: " + result.format + "\n" );
					
		  }, 
		  function (error) {
			  alert("Scanning failed: " + error);
		  }
	   );
	});
	
	activate_upload_queue_button();
	
	//registered
	handle_form_submission( $('form#inventory-form') );
	
	$('form#inventory-form')
	.find('#selling_price-field')
	.add( 'form#inventory-form #cost_price-field' )
	.on('change', function(){
		var cp = parseFloat( $('form#inventory-form #cost_price-field').val() );
		var sp = parseFloat( $('form#inventory-form #selling_price-field').val() );
		
		if( ! cp )cp = 0;
		
		var m = 0;
		if( sp )m = ( ( sp - cp ) / sp ) * 100;
		
		$('#inventory-gross-margin').text( m.toFixed(1) + '%' );
		
		switch( $(this).attr('id') ){
		case 'cost_price-field':
			var q = parseFloat( $('form#inventory-form #item_qty-field').val() );
			var tcp = cp * q;
			
			if( ! tcp )tcp = 0;
			
			$('form#inventory-form #dummy-totalCostPrice').val( $('form#inventory-form #dummy-totalCostPrice').attr('placeholder')+formatNum( tcp.toFixed(2) ) );
		break;
		}
	})
	.on('keyup', function(){
		$(this).change();
	});
	
	$('form#inventory-form')
	.find('#amount_paid-field')
	.on('change', function(){
		var ap = parseFloat( $(this).val() );
		
		var q = parseFloat( $('form#inventory-form #item_qty-field').val() );
		var cp = parseFloat( $('form#inventory-form #cost_price-field').val() );
		
		var tcp = cp * q;
			
		if( ! tcp )tcp = 0;
		if( ! ap )ap = 0;
		
		var ao = tcp - ap;
		
		$('form#inventory-form #amount_owed-field').val( ao );
		$('form#inventory-form #dummy-amntOwed').val( $('form#inventory-form #dummy-amntOwed').attr('placeholder')+formatNum( ao.toFixed(2) ) );
	})
	.on('keyup', function(){
		$(this).change();
	});
	
	$('#new-inventory-finish-button')
	.on('click', function(e){
		e.preventDefault();
		
		$('form#inventory-form').submit();
		
		$.mobile.navigate( "#confirmation", { transition : "none" });
	});
	
	$('#newInventory')
	.find('select#item-select-field')
	.on('change', function(){
		var val = $(this).val();
		if( val && val != 'new' ){
			var inventory = getData( val );
			
			$.each( inventory, function(key , value ){
				$('form#inventory-form')
				.find('#'+key+'-field')
				.val( value );
			});
		}else{
			$('form#inventory-form')
			.find('input')
			.val('');
		}
	});
	
	update_inventory_list_on_inventory_page();
	
	document.addEventListener("deviceready", onDeviceReady, false );
	
	$('a#capture-image-button')
	.on('click', function(e){
		e.preventDefault();
		
		navigator.camera.getPicture(gotPicture, onFail,  { quality : 50, 
		  destinationType : Camera.DestinationType.FILE_URI, 
		  sourceType : Camera.PictureSourceType.CAMERA, 
		  allowEdit : true,
		  encodingType: Camera.EncodingType.JPEG,
		  targetWidth: 200,
		  targetHeight: 200 } );
	 });
  
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        var settings = {
			message_titles:'Cannot Retrieve Location',
			message_message: 'Geo Location is not supported on your device',
			auto_close: 'yes'
		};
		display_popup_notice( settings );
		
		$('#no-geo-location')
		.show();
		
		$('#geo-location')
		.hide();
    }
};

function showPosition(position) {
    x.innerHTML = "Latitude: " + position.coords.latitude + 
    "<br>Longitude: " + position.coords.longitude; 
};

var uploadDataKey = 'upload';
var downloadDataKey = 'download';
var chunkSize = 1000;

function queueUpload( data ){
	var upload = getData( uploadDataKey );
	if( ! upload ){
		var upload = {};
	}
	
	if( upload ){
		$.each(data, function( key , val ){
			/*
			if( ! upload[key] ){
				upload[key] = {};
			}
			*/
			upload[key] = val;
			/*
			$.each( val , function( k , v ){
				upload[key][ k ] = k;
			});
			*/
		});
	}else{
		upload = data;
	}
	
	putData( uploadDataKey , upload );
	
	console.log('uploadQueue', upload);
};

function unQueueUpload( data ){
	var upload = getData( uploadDataKey );
	if( upload && upload[data] ){
		upload[data] = 'delete';
	}
	putData( uploadDataKey , upload );
};

function uploadData(){
	var a = getData( uploadDataKey );
	var b = '';
	var d = {};
	var c = 0;
	var packets = new Array();
	
	ajax_get_url = '?action=upload_data&todo=get_upload_data';
	form_method = 'post';
	ajax_data_type = 'json';
	ajax_action = 'request_function_output';
	ajax_container = $('#login-form');
	
	var x = 0;
	$.each( a , function( key , value ){
		d[ key ] = getData( key );
		++x;
	});
	b = $.param( d );
	
	if( ( b.length / chunkSize ) > 2 ){
		c = Math.ceil( x / ( b.length / chunkSize ) );
	}
	var i = 0;
	var j = 0;
	if( c ){
		$.each( d , function( key , value ){
			
			if( i%c == 0 ){
				j++;
				if( j - 1 && packets[j-1] ){
					ajax_data = packets[j-1];
					console.log( 'packet'+j, ajax_data );
					function_click_process = 1;
					ajax_send();
				}
			}
			if( ! packets[j] )packets[j] = {};
			packets[j][ key ] = value;
			
			++i;
		});
		ajax_data = packets[j];
	}else{
		ajax_data = d;
	}
	function_click_process = 1;
	ajax_send();
};

$( document ).on( "pageshow", "#newInventory", function() {
	//populate_suppliers_select_box( $('#inventory-form').find('select[name="supplier"]') );
	
	populate_category_select_box( $('#inventory-form').find('select[name="category"]') );
});

$( document ).on( "pageshow", "#confirmation", function() {
	var t = storeObjects[ 'total_newly_listed_inventory' ];
	if( ! t )t = 0;
	
	$('#newly-added-inventory-total')
	.html( appCurrency + formatNum(t.toFixed(2)) );
	/*
	$('#newly-listed-inventory-container')
	.html('');
	*/
});

function populate_suppliers_select_box( $element ){
	//Update Suppliers Combo
	var suppliers = get_list_of_suppliers();
	var html = '<option value="" > - Select Supplier - </option>';
	$.each( suppliers , function( key , value ){
		html += '<option value="'+key+'">'+value.supplier+' ('+value.location+')</option>';
	});
	
	if( html ){
		$element
		.html( html );
	}
};

function populate_category_select_box( $element ){
	//Update Suppliers Combo
	var suppliers = get_list_of_category();
	var html = '<option value=""> - Select Category - </option>';
	$.each( suppliers , function( key , value ){
		html += '<option value="'+key+'">'+value.category+'</option>';
	});
	
	if( html ){
		$element
		.html( html );
	}
};

function populate_stores_select_box( $element ){
	//Update Suppliers Combo
	var suppliers = get_list_of_stores();
	var html = '<option value=""> - Select Store - </option>';
	$.each( suppliers , function( key , value ){
		html += '<option value="'+key+'">'+value.name+' ('+value.street+')</option>';
	});
	
	if( html ){
		$element
		.html( html );
	}
};

$( document ).on( "pagecreate", "#stockLevels", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			$("#stockLevels")
			.find('select#filter-category-field')
			.on('change', function(){
				
				var c2 = '.'+$("#stockLevels").find('select#filter-category-field').val().replace(' ','-');
				
				$('tbody.stockLevels-container')
				.find('tr')
				.show();
				
				if( c2.length > 2 ){
					$('tbody.stockLevels-container')
					.find('tr')
					.not(c2)
					.hide();
				}
				
			});
		}else{
			//bind events handlers
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
	
});

$( document ).on( "pageshow", "#stockLevels", function() {
	
	//Update inventory list
	var inventory = get_list_of_inventory();
	var html = '';
	$.each( inventory , function( key , value ){
		html += get_inventory_html( key , value );
	});
	
	if( html ){
		$('tbody.stockLevels-container')
		.html( html )
		.find('tr')
		.tsort();
	}
	populate_category_select_box( $('#stockLevels').find('#filter-category-field') );
	populate_stores_select_box( $('#stockLevels').find('#filter-stores-field') );
});

var pricingData = {};

$( document ).on( "pagecreate", "#setPricing", function() {
	
	test_for_active_user();
	activate_upload_queue_button();
	
	$('#set-inventory-pricing-1')
	.on('click', function( e ){
		$.mobile.navigate( "#cnfrmPricing", { transition : "none" });
	});
	
	$("#setPricing")
	.find('select#filter-category-field')
	.on('change', function(){
		
		var c2 = '.'+$("#setPricing").find('select#filter-category-field').val().replace(' ','-');
		
		$('tbody.stockLevels-container')
		.find('tr')
		.show();
		
		if( c2.length > 2 ){
			$('tbody.stockLevels-container')
			.find('tr')
			.not(c2)
			.hide();
		}
		
	});
});

$( document ).on( "pagecreate", "#cnfrmPricing", function() {
	
	if( customUUID ){
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			
		}else{
			//bind events handlers
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
	
});

$( document ).on( "pageshow", "#cnfrmPricing", function() {
	
	var html = '';
	var launch_date = new Date();
	var timestamp = launch_date.getTime();
		
	if( pricingData && Object.getOwnPropertyNames( pricingData ).length ){
		var i = 0;
		var upload = {};
		$.each( pricingData , function(key, val){
			++i;
			if( ! val.cost_price )var cp = 0;
			else var cp = parseFloat( val.cost_price );
			
			if( ! val.value )var sp = 0;
			else var sp = parseFloat( val.value );
			
			var inventory = getData( key );
			if( inventory ){
				inventory.selling_price = sp;
				inventory.timestamp = timestamp;
				
				putData( key , inventory );
				add_to_list_of_inventory( inventory );
				
				upload[ key ] = key;
			
				if( inventory.stock ){
					$.each( inventory.stock , function( k , v ){
						var stock = getData( k );
						if( stock ){
							stock.selling_price = sp;
							stock.timestamp = timestamp;
							putData( k , stock );
							upload[ key ] = key;
						}
					} );
				}
			
				html += '<tr><td>'+i+'</td><td>'+val.item+'</td><td>'+formatNum(cp.toFixed(2))+'</td><td>'+formatNum(sp.toFixed(2))+'</td></tr>';
			}
		});
		
		queueUpload( upload );
	}else{
		html = '<tr><td colspan="4" style="text-align:center;">No changes were made</td></tr>';
	}
	
	$('tbody#selling-price-of-items')
	.html( html );
});

$( document ).on( "pageshow", "#setPricing", function() {
	
	//Update inventory list
	var inventory = get_list_of_inventory();
	var html = '';
	var html2 = '<option> - Select Item - </option>';
	$.each( inventory , function( key , value ){
		html += get_inventory_set_pricing_html( key , value );
		
		html2 += '<option value="'+key+'" class="'+value.category.replace(' ', '-')+'">'+value.item_desc+'</option>';
	});
	
	if( html ){
		$('tbody.stockLevels-container')
		.html( html )
		.find('tr')
		.tsort();
		
		$('#setPricing')
		.find('#filter-item-field')
		.html( html2 );
		
		$("#setPricing")
		.find('input.inventory-pricing-input')
		.on('change', function(){
			if( $(this).val() != $(this).attr('default-value') ){
				pricingData[ $(this).attr('key') ] = {value: parseFloat( $(this).val() ), item: $(this).attr('item'), cost_price: $(this).attr('cost-price') };
			}else{
				if( pricingData[ $(this).attr('key') ] ){
					delete pricingData[ $(this).attr('key') ];
				}
			}
		});
	}
	populate_category_select_box( $('#setPricing').find('#filter-category-field') );
	populate_stores_select_box( $('#setPricing').find('#filter-stores-field') );
});

$( document ).on( "pagecreate", "#restock", function() {
	test_for_active_user();
	activate_upload_queue_button();
	
	//registered
	handle_form_submission( $('form#stock-form') );
	handle_form_submission( $('form#supply-form') );
	
	$('#manage-inventory-back-button')
	.on('click', function(){
		if( newStock && Object.getOwnPropertyNames(newStock).length && tempStoreObjects && Object.getOwnPropertyNames(tempStoreObjects).length ){
			var r = confirm("Do you want to save changes made to your inventory" );
			if (r == true) {
				$('form#supply-form').submit();
			} else {
				//no - delete newly added items & clear new
				$('form#supply-form')
				.find('input')
				.val('');
				
				tempStoreObjects = {};
				newStock = {};
			}
		}
	});
	
	$('select[name="item_barcode"]')
	.on('change' , function(){
		if( $(this).val() ){
			var key = $(this).val();
			var inventory = get_list_of_inventory();
			
			var $form = $(this).parents('form');
			
			if( inventory[key] ){
				$.each( inventory[key] , function( k , v ){
					switch( k ){
					case 'item_barcode': case 'category': case 'item_qty': case 'amount_paid': case 'total_cost_price': case 'key':
					break;
					default:
						$form
						.find('#'+k+'-field')
						.val( v );
					break;
					}
				} );
			}
		}
	});
	
	$('#stock-form select#filter-location-field')
	.add('#stock-form select#filter-category-field')
	.on('change', function(){
		
		var c1 = '.'+$('#stock-form select#filter-location-field').val().replace(' ','-');
		var c2 = '.'+$('#stock-form select#filter-category-field').val().replace(' ','-');
		
		$('#stock-form')
		.find('select[name="item_barcode"]')
		.find('option')
		.show();
		
		if( c1.length > 2 ){
			$('#stock-form')
			.find('select[name="item_barcode"]')
			.find('option')
			.not(c2)
			.hide();
		}
		
		if( c2.length > 2 ){
			$('#stock-form')
			.find('select[name="item_barcode"]')
			.find('option')
			.not(c2)
			.hide();
		}
		
	});
	
	$('form#stock-form')
	.add( 'form#stock-form #cost_price-field' )
	.on('change', function(){
		var cp = parseFloat( $('form#stock-form #cost_price-field').val() );
		
		if( ! cp )cp = 0;
		
		var q = parseFloat( $('form#stock-form #item_qty-field').val() );
		var tcp = cp * q;
		
		if( ! tcp )tcp = 0;
		
		$('form#stock-form #dummy-totalCostPrice').val( $('form#stock-form #dummy-totalCostPrice').attr('placeholder') + formatNum( tcp.toFixed(2) ) );
	})
	.on('keyup', function(){
		$(this).change();
	});
	
	$('form#supply-form')
	.find('#total_amount_paid-field')
	.on('change', function(){
		var ap = parseFloat( $(this).val() );
		
		var tcp = parseFloat( $('form#supply-form #total_amount-field').val() );
			
		if( ! tcp )tcp = 0;
		if( ! ap )ap = 0;
		
		var ao = tcp - ap;
		
		$('form#supply-form #total_amount_owed-dummy').val( $('form#supply-form #total_amount_owed-dummy').attr('placeholder') + formatNum( ao.toFixed(2) ) );
	})
	.on('keyup', function(){
		$(this).change();
	});
	
});

function updateSupplyFormFields( data ){
	if( data && $('form#supply-form') ){
		
		var a = parseFloat( $('form#supply-form').find('input[name="total_amount_paid"]').val() );
		if( ! a )a = 0;
		data.total_amount_owed = parseFloat( data.total_amount ) -  a;
		
		if( ! data.total_amount_owed ){
			data.total_amount_owed = 0;
		}
		
		$.each(data, function(key , val){
			switch( key ){
			case 'total_amount_paid':
			break;
			default:
				if( $('form#supply-form').find('input[name="'+key+'"]') ){
					$('form#supply-form')
					.find('input[name="'+key+'"]')
					.val( val );
				}
				
				if( $('form#supply-form').find('#'+key+'-dummy') ){
					$('form#supply-form')
					.find('#'+key+'-dummy')
					.val( $('form#supply-form').find('#'+key+'-dummy').attr('placeholder') + formatNum( val.toFixed(2) ) );
				}
			break;
			}
		});
		
	}
};

var low_stock_level = 25;

$( document ).on( "pagecreate", "#inventory", function() {
	test_for_active_user();
	$("#inventory")
	.find('select#filter-category-field')
	.on('change', function(){
		
		var c2 = '.'+$("#inventory").find('select#filter-category-field').val().replace(' ','-');
		
		$('tbody.stockLevels-container')
		.find('tr')
		.show();
		
		if( c2.length > 2 ){
			$('tbody.stockLevels-container')
			.find('tr')
			.not(c2)
			.hide();
		}
		
	});
});

$( document ).on( "pageshow", "#inventory", function() {
	var userInfo = get_user_info();
	
	populate_category_select_box( $('#inventory').find('#filter-category-field') );
	
	//Update inventory list
	var inventory = get_list_of_inventory();
	
	var label = new Array();
	var values = new Array();
	var i = 0;
	
	var total_value = 0;
	var total_items = 0;
	
	var html = '';
	
	var html2 = '<option> - Select Item - </option>';
		
	$.each( inventory , function( key , value ){
		if( value ){
		if( ! value.item_sold )value.item_sold = 0;
		
		label[i] = value.item_desc;
		
		values[i] = ( parseFloat( value.item_qty ) - parseFloat( value.item_sold ) );
		
		total_value += ( parseFloat( value.item_qty ) - parseFloat( value.item_sold ) )* value.selling_price;
		total_items += ( parseFloat( value.item_qty ) - parseFloat( value.item_sold ) );
		
		++i;
		
		html += get_inventory_html( key , value );
		
		html2 += '<option value="'+key+'" class="'+value.category.replace(' ', '-')+'">'+value.item_desc+'</option>';
		}
	});
	
	if( html ){
		$('tbody.stockLevels-container')
		.html( html )
		.find('tr')
		.tsort();
		
		$('#inventory')
		.find('#filter-item-field')
		.html( html2 );
	}
	//.find('.sort-element')
	//.tsort({attr:'stock', order:'asc'});
	
	
	$('.total-value-of-inventory')
	.html( appCurrency + formatNum(total_value.toFixed(2) ) );
	
	$('.total-items-in-stock')
	.html( formatNum( total_items ) );
	
	$('.total-unique-items')
	.html( formatNum( i ) );
	
	if( label && values && i ){
		var data = {};
		data.label = label;
		data.value = values;
		data.id = 'chart6';
		data.axislabel = new Array();
		data.axislabel[0] = {label:'Remaining Stock'};
		activate_bar_chart( data );
	}
});

function get_inventory_level_html( value , i ){
	
	var units = parseFloat( value.item_qty ) - parseFloat( value.item_sold );
	var stclass = 'stcklvl';
	
	if( units < low_stock_level ){
		var stclass = 'stcklow';
	}
	return '<div class="sort-element ui-block-c" stock="'+units+'"><div class="ui-bar ui-bar-a" style="height:65px;">'+value.item_desc+'<span class="'+stclass+'">' + units +'</span></div></div>';
};

$( document ).on( "pageshow", "#restock", function() {
	
	//Update inventory list
	var inventory = get_list_of_inventory();
	var html = '<option> - Select Item - </option>';
	$.each( inventory , function( key , value ){
		html += '<option value="'+key+'" class="'+value.category.replace(' ', '-')+'">'+value.item_desc+'</option>';
	});
	
	if( html ){
		$('#stock-form')
		.find('select[name="item_barcode"]')
		.html( html );
	}
	
	populate_category_select_box( $('#stock-form').find('#filter-category-field') );
	populate_suppliers_select_box( $('#stock-form').find('select[name="supplier"]') );
});

var default_vat_value = 5;
var add_vat_to_sale = default_vat_value;
var salesData = {};

$( document ).on( "pagecreate", "#checkout", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			
			//registered
			$('#checkout-payment-method')
			.on( 'change', function(){
				salesData.payment_method = $(this).val();
			});
			
			$('#confirm-this-sale-button')
			.on( 'click', function(){
				if( $('#amount_tendered-field').val() ){
					salesData.total_amount_tendered = parseFloat( $('#amount_tendered-field').val() );
					 
					var stored = store_record( salesData );
					successful_submit_action( stored );
					
					salesData = {};
					
					$('#this-sale-change').html('0.00');
					$.mobile.navigate( "#sales", { transition : "none" });
				}else{
					var settings = {
						message_titles:'Invalid Amount',
						message_message: 'Please enter the amount tendered',
						auto_close: 'yes'
					};
					display_popup_notice( settings );
				}
			});
			
			$('#amount_tendered-field')
			.on( 'change' , function(){
				if( salesData.total_amount ){
					var change = parseFloat( $(this).val() ) -  parseFloat( salesData.total_amount );
					
					$('#this-sale-change')
					.html( formatNum( change.toFixed(2) ) );
				}
			})
			.on('keyup', function(){
				$(this).change();
			});
			
		}else{
			//bind events handlers
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pageshow", "#checkout", function() {
	
	var userInfo = get_user_info();
		
	//Update inventory list
	var html = '';
	
	if( salesData && Object.getOwnPropertyNames( salesData ).length ){
		var i = 0;
		var upload = {};
		if( salesData.inventory ){
		
			$.each( salesData.inventory , function(key, val){
				
				var amount = val.unit_ordered * val.unit_selling_price;
				var up = parseFloat( val.unit_selling_price );
				
				html += '<tr><td class="label">'+val.item_desc+'</td><td>'+val.unit_ordered+'</td><td>' + formatNum( up.toFixed(2) ) + '</td><td>' + formatNum( amount.toFixed(2) ) + '</td></tr>';
			});
			
			var v = salesData.vat;
			$('#checkout-vat')
			.text( formatNum( v.toFixed(2) ) );
			
			var d = salesData.discount;
			$('#checkout-discount')
			.text( formatNum( d.toFixed(2) ) );
			
			//queueUpload( upload );
			salesData.payment_method = $('#checkout-payment-method').val();
			
			$('#amount_tendered-field').val( salesData.total_amount_tendered );
			
			var a = salesData.total_amount;
			$('#this-sale-total-amount')
			.val( formatNum( a.toFixed(2) ) );
			
			$('#this-sale-checkout-total').html( salesData.total_amount );
		}
	}
	
	if( ! html ){
		html = '<tr><td colspan="4" style="text-align:center;">Empty Cart</td></tr>';
	}
	
	$('tbody#checkout-table-body')
	.html( html );
	
});

$( document ).on( "pagecreate", "#sales", function() {
	test_for_active_user();
	//activate_upload_queue_button();
	
	$('#vat-on-off-switch')
	.on('change', function(){
		
		if( add_vat_to_sale )add_vat_to_sale = 0;
		else add_vat_to_sale = default_vat_value;
		
		calculate_total_sales();
	});
	
	$('#percentage-discount')
	.on('change', function(){
		calculate_total_sales();
	})
	.on('keyup', function(){
		calculate_total_sales();
	});
	
	$('#confirm-this-sale-popup-display-button')
	.on( 'click', function(){
		if( $('#sales-table-body').find('tr.item-for-sale').length > 0 ){
			
			$('#sales-table-body')
			.html('');
			$('#items-in-cart').text('0');
			
			$('#this-sale-total-amount-vat')
			.add('#this-sale-subtotal-amount')
			.add('#this-sale-total-amount-discount')
			.add('#this-sale-total-amount')
			.html('0.00');
			
			return true;
		}
		var settings = {
			message_title:'Empty Cart',
			message_message: 'Please add item(s) to your cart',
			auto_close: 'yes'
		};
		display_popup_notice( settings );
		
		return false;
	});
	
	$('#cancel-order-button')
	.on( 'click', function(){
		salesData = {};
		
		$('#sales-table-body')
		.find('tr')
		.remove();
		
		calculate_total_sales();
		
		$('#items-in-cart').text('0');
		
		$('#this-sale-total-amount-vat')
		.add('#this-sale-subtotal-amount')
		.add('#this-sale-total-amount-discount')
		.add('#this-sale-total-amount')
		.html('0.00');
	});
	
});

$( document ).on( "pageshow", "#sales", function() {
	
	var userInfo = get_user_info();
	if( userInfo.vat ){
		default_vat_value = parseFloat( userInfo.vat );
	}
		
	//Update inventory list
	var inventory = get_list_of_inventory();
	var html = '';
	$.each( inventory , function( key , value ){
		var qty = 0;
		if(  value.item_qty )qty = parseFloat( value.item_qty );
		if(  value.item_sold )qty -= parseFloat( value.item_sold );
		
		if( qty ){
			html += '<li><a href="#" key="'+key+'" max-qty="'+qty+'" selling-price="'+value.selling_price+'" cost-price="'+value.cost_price+'"><img src="image bank/Evian - 50cl.jpg" class="ui-li-thumb" /><p>'+value.item_desc+'</p></a></li>';
		}
	});
	
	if( html ){
		$('#sales-inventory-list-container')
		.html( '<ul data-role="listview" data-filter="true" data-filter-reveal="false" data-filter-placeholder="Scan/Search Product" id="sales-inventory-list" data-inset="true">' + html + '</ul>' )
		.trigger('create');
		
		$('#sales-inventory-list')
		.find('a')
		.on('click', function(e){
			e.preventDefault();
			
			var amount = parseFloat( $(this).attr('selling-price') );
			var cost = parseFloat( $(this).attr('cost-price') );
			var $item = $('#sales-table-body').find('tr#'+$(this).attr('key') );
			
			var units = 0;
			
			if( $item && $item.is(':visible') ){
				var $input = $item.find( 'input' );
				if( $input.attr('max') && parseFloat( $input.val() ) < parseFloat( $input.attr('max') ) ){
					units = parseFloat( $input.val() ) + 1;
					
					$input.val( units );
					
					amount *= units;
					
					$item
					.find('td.price')
					.attr('total', amount )
					.attr('units', units )
					.find('.price-val')
					.html( formatNum( amount.toFixed(2) ) );
				}
			}else{
				$('#sales-table-body')
				.prepend( '<tr id="'+$(this).attr('key')+'" unit-price="'+amount+'" cost-price="'+cost+'" class="item-for-sale"><td class="label">'+$(this).text()+'</td><td class="input"><input type="number" min="1" step="1" max="'+$(this).attr('max-qty')+'" value="1" /></td><td class="price" total="'+amount+'" units="1"><span class="price-val">' + formatNum( amount.toFixed(2) ) + '</span></td><td><a href="#" class="ui-btn ui-btn-inline ui-icon-delete ui-btn-icon-notext ui-theme-a ui-corner-all">remove</a></td></tr>' );
				
				$('#sales-table-body')
				.find('tr#'+$(this).attr('key')+' input[type="number"]' )
				.bind('change', function(){
					var $tr = $(this).parents('tr');
					
					var amount = parseFloat( $tr.attr('unit-price') );
					
					var units = parseFloat( $(this).val() );
					amount *= units;
					
					$tr
					.find('td.price')
					.attr('total', amount )
					.attr('units', units )
					.find('.price-val')
					.html( formatNum( amount.toFixed(2) ) );
					
					calculate_total_sales();
				}).bind('blur', function(){
					if( $(this).attr('max') && ( parseFloat( $(this).val() ) > parseFloat( $(this).attr('max') ) ) ){
						$(this)
						.val( $(this).attr('max') );
						
						$(this).change();
					}
				});
				
				$('#sales-table-body')
				.find('tr a' )
				.bind('click', function(){
					$(this).parents('tr').remove();
					calculate_total_sales();
				});
				
				/*
				$('#sales-table-body')
				.find('tr')
				.on( "swipeleft", function(e){
					$(this)
					.find('a')
					.fadeIn();
				})
				.on( "swiperight", function(e){
					$(this)
					.find('a')
					.fadeOut();
				});
				*/
				units = 1;
			}
			
			if( units ){
				calculate_total_sales();
			}
			
		});
	}
	
});

function calculate_total_sales(){
	if( $('#sales-table-body') ){
		var total_price = 0;
		var total_units = 0;
		var total_cost_price = 0;
		
		var items = {};
		
		var i = 0;
		$('#sales-table-body')
		.find('tr.item-for-sale')
		.each(function(){
			var key = parseFloat( $(this).attr('id') );
			items[ key ] = {
				key: key,
				item_desc: $(this).find('td.label').html(),
				unit_selling_price: parseFloat( $(this).attr('unit-price') ),
				unit_ordered: parseFloat( $(this).find('input[type="number"]').val() ),
			};
			
			total_price += parseFloat( $(this).find('td.price').attr('total') );
			total_units += parseFloat( $(this).find('td.price').attr('units') );
			total_cost_price += parseFloat( $(this).attr('cost-price') ) * parseFloat( $(this).find('td.price').attr('units') );
			++i;
		});
		
		var vat = 0;
		if( total_price )vat = total_price * add_vat_to_sale / 100;
		
		$('#items-in-cart')
		.text( i );
		
		$('#this-sale-total-amount-vat')
		.html( formatNum( vat.toFixed(2) ) );
		
		$('#this-sale-subtotal-amount')
		.html( formatNum( total_price.toFixed(2) ) );
		
		var total = total_price + vat;
		
		add_discount_to_sale = $('#percentage-discount').val();
		
		var discount = 0;
		if( total ){
			discount = total * add_discount_to_sale / 100;
			
			var dt = total;
			$('#this-sale-total-amount-discount')
			.html( formatNum( discount.toFixed(2) ) + ' from ' + formatNum( dt.toFixed(2) )  );
			
			total -=  discount;
		}else{
			$('#this-sale-total-amount-discount')
			.html( '0.00' );
		}
		
		if( total_units ){
			salesData = {
				object: 'sales',
				error: false,
				inventory: items,
				total_amount: total,
				vat: vat,
				discount: discount,
				subtotal: total_price,
				total_units: total_units,
				total_cost_price: total_cost_price,
				total_amount_tendered: total,
				payment_method: '',
			};
		}
		
		$('#this-sale-total-amount')
		.html( formatNum( total.toFixed(2) ) );
		
	}
};

$( document ).on( "pagecreate", "#viewAndModifyUserDetails-page", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			var html = '';
			$.each( userInfo , function( key , value ){
				switch( key ){
				case 'error': case 'object': case 'password': case 'cemail':
				break;
				default:
					html += '<div class="user-info user-info-'+key+'"><label>'+key+'</label><div>'+value+'</div>';
				break;
				}
			});
			
			//registered
			$('#user-details-container')
			.html( html );
			
			//bind form submit event handler
		}else{
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pagecreate", "#update-progress", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( ! userInfo ){
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pageshow", "#update-progress", function() {
	$('#update-progress-area')
	.html('');
	
	update_and_re_trigger_data_download( tempDownloadObjects );
	tempDownloadObjects = {};
});

function update_and_re_trigger_data_download( tempData ){
	if( tempData && Object.getOwnPropertyNames( tempData ).length ){
		var i = '';
		$.each( tempData , function( object , key ){
			var obj = getData( object );
			if( ! obj )obj = {};
			
			$.each( key , function( k , v ){
				putData( k , v );
				obj[ k ] = k;
			});
			
			putData( object , obj );
			
			$('#update-progress-area')
			.prepend('<li>Download Complete - '+object.replace( '_' , ' ' )+'</li>');
			
			i = object;
		});
		
		if( i ){
			//place next request
			ajax_data = { app_uid: customUUID };
			form_method = 'post';
			ajax_data_type = 'json';
			ajax_action = 'request_function_output';
			ajax_container = $('#login-form');
			ajax_get_url = '?action=data_transfer&todo=download_data';
			ajax_send();
		}
	}
};

function activate_record_delete_button(){
	$('.delete-record')
	.on('click', function(e){
		e.preventDefault();
		if( $(this).attr('key') && $(this).attr('object') ){
			var key = $(this).attr('key');
			var object = $(this).attr('object');
			
			var r = confirm('Do you want to delete the selected record');
			if( r == true ){
				clearSingleData( key );
				
				var obj = getData( object );
				if( obj[ key ] ){
					delete obj[ key ];
				}
				putData( object , obj );
				
				unQueueUpload( key );
				
				$('form#'+object+'-form')
				.find('input')
				.val('');
				
				$('#'+key)
				.remove();
				
				$('option[value="'+key+'"]')
				.remove();
				
				unQueueUpload( key );
			}
		}else{
			var settings = {
				'message_title':'No Selected Record',
				'message_message':'Please select a record to delete',
			};
			display_popup_notice( settings );
		}
	});
};

function activate_upload_queue_button(){
	$('.upload-queue')
	.on('click', function(e){
		uploadData();
	});
};

function clearSingleData( key ){
	amplify.store( key , null );
};
	
function clearData(){
	var storedObjects = amplify.store();
	
	//console.log('all',  storedObjects );
	//ga('send', 'pageview', {'page': '/user-triggered-refresh' , 'title': 'User Refreshed App' });
	
	$.each( storedObjects , function ( key , value ){
		switch( key ){
		case 'custom-uuid':
		break;
		default:
			amplify.store( key , null );
		break;
		}
	});
};

function putData( key , value ){
	return amplify.store( key , value );
};

function getData( key ){
	return amplify.store( key );
};

function get_dynamic_categories(){
	ajax_data = {};
	form_method = 'post';
	ajax_data_type = 'json';
	ajax_action = 'request_function_output';
	ajax_container = $('#login-form');
	ajax_send();
};

function get_active_page_id(){
	var active_page = $( "body" ).pagecontainer( "getActivePage" );
	var active_page_id = active_page.context.location.hash;
	
	if( active_page_id ){
		active_page_id = active_page_id.replace('#', '');
	}
	
	return active_page_id;
};

function ajax_send(){
	
	if(function_click_process){
		
		var user = get_user_info();
		
		if( user && user.key ){
			ajax_data.app_user_id = user.key;
			ajax_data.store_id = get_current_store_id();
			ajax_data.store_owner_id = customUUID;
		}
		
		if( customUUID ){
			ajax_data.app_uid = customUUID;
		}
	//Send Data to Server
	$.ajax({
		dataType:ajax_data_type,
		type:form_method,
		data:ajax_data,
		url: pagepointer+'php/app_request_processor.php'+ajax_get_url,
		timeout:30000,
		beforeSend:function(){
			//Display Loading Gif
			function_click_process = 0;
			
			cancel_ajax_recursive_function = false;
			
			confirm_action_prompt = 0;
			
			/*ajax_container.html('<div id="loading-gif" class="no-print">Please Wait</div>');*/
			
			$('div.progress-bar-container')
			.html('<div class="virtual-progress-bar"><div class="progress-bar"></div></div>');
			
			progress_bar_change();
			
			console.log( 'send' , ajax_data );
			ajax_request_md5_key = '';
			ajax_request_md5_key += ajax_data_type + form_method + pagepointer + ajax_get_url;
			if( typeof(ajax_data) == "object" )
				ajax_request_md5_key += $.param( ajax_data );
			else
				ajax_request_md5_key += ajax_data;
			
			/*CHECK FOR LOCALLY STORED DATA*/
			/*
			ajax_request_md5_key = md5( ajax_request_md5_key );
			
			var storedData = getData( ajax_request_md5_key );
			
			if( storedData ){
				if( ! ( storedData.expiry_time && storedData.expiry_time > 60000 && storedData.expiry_time < Date.now() ) ){
					ajaxSuccess( storedData , false );
					return false;
				}
			}
			*/
		},
		error: function(event, request, settings, ex) {
			ajaxError( event, request, settings, ex );
		},
		success: function(data){
			ajaxSuccess( data , true );
		}
	});
	}
};

function ajaxError( event, request, settings, ex ){
	if( $('#app-loading-animation-id').is(':visible') ){
		$('#app-loading-animation-id')
		.hide();
		
		if( $("#home-page-example-wrapper") && $("#home-page-example-wrapper").hasClass('iscroll-wrapper') ){
			$("#home-page-example-wrapper").iscrollview("refresh");
		}
	}
};

function ajaxSuccess( data , store ){
	/*store data in local storage*/
	
	if( data && store ){
		//Set Expiry Time
		//data.expiry_time = Date.now() + 18000000;	//5 hours
		//putData( ajax_request_md5_key , data );
	}
	
	requestRetryCount = 0;
	
	function_click_process = 1;
	
	if( data.status ){
		switch(data.status){
		case 'registered-user':
			ajax_data = {};
			ajax_get_url = '';
			
			if( data.saved_record_id && tempData ){
				//store data
				putData( customUUIDkey , data.saved_record_id );
				ga( 'send' , 'pageview' , {'page': '/registered-user' , 'title': 'User Registered '+customUUID+'/'+data.saved_record_id } );
				
				customUUID = data.saved_record_id;
				
				tempData.key = data.saved_record_id;
				tempData.id = data.saved_record_id;
				
				var stored = store_record( tempData );
				successful_submit_action( stored );
				
				tempData = {};
				console.log( 'as' , stored );
				
				data.typ = '';
			}
		break;
		case 'created-user':
			ajax_data = {};
			ajax_get_url = '';
			
			if( data.saved_record_id && tempData ){
				//store data
				ga( 'send' , 'pageview' , {'page': '/created-new-user' , 'title': 'Created User '+data.saved_record_id+' by '+customUUID } );
				
				tempData.key = data.saved_record_id;
				tempData.id = data.saved_record_id;
				
				var stored = store_record( tempData );
				successful_submit_action( stored );
				
				var users_list = add_to_list_of_users( stored );
				update_users_list_on_users_page();
				
				tempData = {};
				console.log( 'user created' , stored );
				
				data.typ = '';
			}
		break;
		case 'logged-in-user':
			ajax_data = {};
			ajax_get_url = '';
			
			if( data.user_details.id && data.user_details.key ){
				//store data
				putData( customUUIDkey , data.user_details.id );
				ga( 'send' , 'pageview' , {'page': '/logged-in-user' , 'title': 'User Login '+customUUID+'/'+data.user_details.id } );
				
				customUUID = data.user_details.id;
				
				tempData = data.user_details;
				
				var stored = store_record( tempData );
				
				if( data.begin_download ){
					tempDownloadObjects = data.begin_download;
					$.mobile.navigate( "#update-progress", { transition : "none" } );
				}else{
					$.mobile.navigate( "#dashboard", { transition : "none" });
				}
				
				data.typ = '';
			}
		break;
		case 'data-download-progress':
			ajax_data = {};
			ajax_get_url = '';
			
			if( data.continue_download ){
				//store data
				ga( 'send' , 'pageview' , {'page': '/data-download' , 'title': 'Data Download '+customUUID } );
				
				if( data.continue_download ){
					update_and_re_trigger_data_download( data.continue_download );
				}else{
					//$.mobile.navigate( "#dashboard", { transition : "none" });
				}
				
			}
		break;
		case 'data-download-complete':
			ajax_data = {};
			ajax_get_url = '';
			
			//store data
			ga( 'send' , 'pageview' , {'page': '/data-download-complete' , 'title': 'Data Download Complete '+customUUID } );
			document.location = document.location;
			$.mobile.navigate( "#dashboard", { transition : "none" });
		break;
		case 'uploaded-data':
			if( data.keys ){
				var a = getData( uploadDataKey );
				$.each( data.keys , function( key , id ){
					if( a[key] )delete a[key];
					
					var d = getData( key );
					if( d.key )d.id = id;
					putData( key , d );
				});
				
				putData( uploadDataKey , a );
				console.log( 'keys' , data.keys );
				console.log( 'current-upload-queue', a );
			}
		break;
		}
	}
	
	if( data.typ ){
		switch(data.typ){
		case 'serror':
		case 'uerror':
		case 'saved':
			if( data.err && data.msg ){
				var settings = {
					'message_title':data.err,
					'message_message':data.msg,
				};
				display_popup_notice( settings );
			}
		break;
		}
	}
	
	//CHECK FOR NOTIFICATION
	if(data.notification){
		check_for_and_display_notifications(data.notification);
	}
	
};

//Bind Multi-select option tooltip
var timer_interval;
var mouse_vertical_position;

var progress_bar_timer_id;
function progress_bar_change(){
	var total = 20;
	var step = 1;
	
	if(function_click_process==0){
		var $progress = $('.virtual-progress-bar').find('.progress-bar');
		
		if($progress.data('step') && $progress.data('step')!='undefined'){
			step = $progress.data('step');
		}
		
		var percentage_step = (step/total)*100;
		++step;
		
		if( percentage_step > 100 ){
			$progress
			.css('width', '100%');
			
			$('.virtual-progress-bar')
			.remove();
			
			$('.progress-bar-container')
			.html('');
			
			//Refresh Page
			function_click_process = 1;
			
			++requestRetryCount;
			
			//Stop All Processing
			window.stop();
			
			//check retry count
			if( requestRetryCount > 1 ){
				//display no network access msg
				//requestRetryCount = 0;
				
				var settings = {
					message_title:'No Network Access',
					message_message: 'The request was taking too long!',
					auto_close: 'no'
				};
				
			}else{
				//display retrying msg
				
				var settings = {
					message_title:'Refreshing...',
					message_message: 'Please Wait.',
					auto_close: 'yes'
				};
				
				//request resources again
				ajax_send();
				
			}
			display_popup_notice( settings );
			
		}else{
			$progress
			.data('step',step)
			.css('width', percentage_step+'%');
			
			progress_bar_timer_id = setTimeout(function(){
				progress_bar_change();
			},1000);
		}
	}else{
		$('.virtual-progress-bar')
		.find('.progress-bar')
		.css('width', '100%');
		
		setTimeout(function(){
			$('.virtual-progress-bar')
			.remove();
			
			$('.progress-bar-container')
			.html('');
		},800);
	}
};

//Display Notification Pop-up
function display_popup_notice( settings ){
	
	var theme = 'a';
	
	var html = settings.message_title + "\n" + settings.message_message;
	
	alert( html );
	/*
	var html = '<div data-role="popup" id="errorNotice" data-position-to="#" data-theme="'+theme+'" data-overlay-theme="b" data-dismissible="true">';
		html = html + '<div role="main" class="ui-content">';
		html = html + '<h3>'+settings.message_title+'</h3>';
		html = html + '<p>'+settings.message_message+'</p>';
	html = html + '</div></div>';
	
	$('#notification-popup')
	.html( html )
	.trigger("create");
		
	//Close All Pop-ups
	if( $('.ui-popup') ){
		$('.ui-popup')
		.popup("close");
	}
	
	$('#errorNotice')
	.popup("open");
	
	if( settings.auto_close ){
		switch( settings.auto_close ){
		case "yes":
			setTimeout(function(){
				$("#errorNotice")
				.popup("close");
			}, 3000 );
		break;
		}
	}
	
	$( "#errorNotice" ).on( "popupafterclose", function( event, ui ) {
		$('#errorNotice').remove();
	});
	*/
};

function activate_bar_chart( data ){
	return false;
	
	$.jqplot.config.enablePlugins = true;
  
	if( ! ( data.id && data.label) ){
		return false
	}
	
	if( data.value ){
		var dataset = new Array();
		dataset[0] = data.value;
		var color = ['#ff6600'];
	}
	
	if( data.value1 && data.value2 ){
		var dataset = new Array();
		dataset[0] = data.value1;
		dataset[1] = data.value2;
		var color = ['#ccc','#ff6600'];
	}
	
	if( ! dataset ){
		
		return false;
	}
	//var s61 = [7,8,11,16,21];
	
	var ticks6 = data.label;
	
	$('#'+ticks6)
	.html('');
	
	var chart = {
		// Only animate if we're not using excanvas (not in IE 7 or IE 8)..
		animate: !$.jqplot.use_excanvas,
		seriesColors:color,
		seriesDefaults:{
			pointLabels: { show: true},
			renderer:$.jqplot.BarRenderer,
			
			rendererOptions: { barDirection: 'horizontal', barPadding: 0,fillToZero: true},
			shadow:false,
			background: '#4bb2cf',
		},
			series:data.axislabel,
			legend: {
			 
			
		},
		
		grid: {
			gridLineColor: '#fff',
			borderWidth: 1.0,
			background: '#fff',
			borderColor: '#fff',
			shadow: false
		
		},
		
		axes: {
			xaxis: {
				showTicks: false
			},
			
			yaxis: {
				renderer: $.jqplot.CategoryAxisRenderer,
				ticks: ticks6,
				
			}
		}
	};
	
	plot6 = $.jqplot( data.id , dataset, chart );
};

function formatNum(n) {
  var n = ('' + n).split('.');
  var num = n[0];
  var dec = n[1];
  var r, s, t;

  if (num.length > 3) {
	s = num.length % 3;

	if (s) {
	  t = num.substring(0,s);
	  num = t + num.substring(s).replace(/(\d{3})/g, ",$1");
	} else {
	  num = num.substring(s).replace(/(\d{3})/g, ",$1").substring(1);
	}
  }

  if (dec && dec.length > 3) {
	dec = dec.replace(/(\d{3})/g, "$1 ");
  }

  return num + (dec? '.' + dec : '');
};

function piechart( data ){
	if( data.id && data.dataset ){
		
		$( data.id ).highcharts({
			chart: {
				plotBackgroundColor: null,
				plotBorderWidth: null,
				plotShadow: false
			},
			title: {
			   text: ''
			},
			tooltip: {
				pointFormat: '{series.name}: N<b>{point.y}</b>'
			},
			
			plotOptions: {
			   pie: {
						allowPointSelect: true,
						cursor: 'pointer',
						dataLabels: {
							enabled: false
						},
						showInLegend: true
					}
			},
			series: [{
				type: 'pie',
				name: 'Total sale today',
				data: data.dataset,
			}]
		});
	}
};

function gotPicture( imageURI ) {
    var image = document.getElementById('myImage');
    image.src = imageURI;
	alert('file loc '+imageURI);
	
	$('#newInventory')
	.find('input[name="item_image"]')
	.val( imageURI );
	//get file
	//fileSystem.getDirectory("blubird", {create: true, exclusive: false}, gotDirectory , onFail );
};
function readEntries(entries){
	for(var i=0,len=entries.length; i<len; i++)
	{
	//Name of the picture within "DCIM/Camera"
	alert(entries[i].name);
	}
};
function onFail(message) {
    alert('Failed because: ' + message);
};

function onSuccess(fileSystem) {
    gfileSystem = fileSystem;
	alert('fils sys name '+fileSystem.name);
    alert('root '+fileSystem.root.name);
    alert('root fullpath '+fileSystem.root.fullpath);
	
	fileSystem.getDirectory("blubird/", {create: true, exclusive: false}, gotDirectory , onFail );
};

function gotDirectory( dirEntry ){
	// Get a directory reader
	var directoryReader = dirEntry.createReader();
	//console.log('dir', directoryReader );
	// Get a list of all the entries in the directory
	directoryReader.readEntries( readEntries , onFail );
};
//read file system
function onDeviceReady(){
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, null);
};