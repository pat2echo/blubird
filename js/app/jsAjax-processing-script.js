/*
 * JavaScript Dashboard Class
 * Created On: 24-MAY-2014
 * Created By: Ogbuitepu O. Patrick
 *
 *pageshow
 --kiosk --kiosk-printing
 chrome://appcache-internals/
 
 Inventory keys  = store_owner_id + barcode
 All other table keys = app_user_id + barcode
*/

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','js/app/analytics.js','ga');

var customUUIDkey = 'custom-uuid';
var deviceIDkey = 'device-id';
var restorePointsIDkey = 'restore-points-id';
var lockIDkey = 'lock-id';
var deviceID = '';
var appUserID = '';
var appUIDkey = 'app-user-id';
var appSwitchUserkey = 'app-switched-user';

var deviceID = getData( deviceIDkey );
var customUUID = getData( customUUIDkey );
var appUserID = getData( appUIDkey );

if( ! customUUID ){
	var launch_date = new Date();
	var customUUID = launch_date.getTime();
	putData( customUUIDkey , customUUID );
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
var appDB = new Dexie("blubird");
appDB.version(1).stores({
    restore_points: 'id,data,timestamp,size',
    // ...add more stores (tables) here...
});
// Open it
appDB.open();
//appDB.delete();
    
document.addEventListener("deviceready", onDeviceReady, false);

var months_of_year = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var full_months_of_year = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var weekdays = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
    
var blubirdFileURL = '';
var blubirdWebbased = 0;

var gfileSystem;

var appSettings = {};
var appCurrencyText = 'NGN';
var appCurrency = '&#8358;';
var appDiscountType = 'percentage';
var appVATValue = 0;
var appLowStockLevel = 25;
var appPrinterCharacterLength = 24;
var appPrinterSeperatorLength = 28;
var appTimeToUploadData = 5;
var appMode = 'retail'; // retail | restaurant
var appNotificationFrequency = 'per_transaction'; // per_transaction | per_day

var appVersionNumber = '1.1.0';
var appSalter = '10839hxecd439adsaSD05a7dcNSCIVue7';

var numOfStores = 1;
var currentStoreID = '';

var appLoadCount = 0;
var dataLimit = 5;

var appLoad = true;

var signOut = false;

var appShowLoadingAnimation = false;

var activePage = true;

var tempCategoryHTML = new Array();

var requestRetryCount = 0;

var dataUploadTimerID;

var pushNotification;
var pushNotificationID = 'default';

function onDeviceReady(){
    window.requestFileSystem( LocalFileSystem.PERSISTENT, 0, initFileSystem, fail );
    
    pushNotification = window.plugins.pushNotification;   
    pushNotification.register( function(){}, errorHandler, { 'senderID':'628773795445', 'ecb':'onNotificationGCM' });
};

function errorHandler(error) { alert('Push Notification Reg Error\n\n'+ error); };

function onNotificationGCM(e) {
    switch(e.event){ 
    case 'registered': if (e.regid.length > 0){ pushNotificationID = e.regid; } break;
    case 'message': 
        var launch_date = new Date();
        var n = {'key': 'pn'+launch_date.getTime(), 'detailed_message':e.message, 'object':"notifications", 'store_id':currentStoreID, 'store_owner':currentStoreID, 'subtitle':e.message, 'title':e.title, 'page_id': "", 'send_email': "", 'status': "", 'target_user': "", 'timestamp': launch_date.getTime(), 'type': "", 'creationtimestamp':launch_date.getTime(), 'created_by':appUserID };
        var notifications1 = getData( 'notifications' );
        if( ! notifications1 )notifications1 = {};
        notifications1[n.key] = n.key;
        putData( 'notifications', notifications1 );
        putData( n.key, n );
        prepare_notifications_for_display(0);
    break;
    case 'error': alert('Push Notification Msg Error\n\n'+ error); break;
    default: alert('An unknown event was received'); break;
    }
};

//var pagepointer = 'http://localhost/blubird/server/engine/';
//var pagepointer = 'http://blubird.maybeachtech.com/engine/';
var pagepointer = 'http://blubirdtest.maybeachtech.com/engine/';
//var pagepointer = 'http://blubird104.maybeachtech.com/engine/';

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

var storeObjects = {};

var unreadNotificationsCount = 0;

function test_for_active_user(){
    var ld = new Date();
    var lastCompileDate = getData('last-compile-time');
    
    if( ! lastCompileDate ){
        lastCompileDate = ld.getTime() - 1;
    }    
    putData( 'last-compile-time', lastCompileDate );
    
	if( lastCompileDate > ld.getTime() ){
        var settings = {
            message_title:'Invalid Device Date & Time',
            message_message: 'To obtain accurate results, please set your device date & time and restart the application',
            auto_close: 'no'
        };
        display_popup_notice( settings );
    }else{
        putData( 'last-compile-time', ld.getTime() );
    }
    
    if( customUUID && deviceID ){
        
        //check for registered user details
        var userInfo = get_user_info();
        if( userInfo ){
            
            if( ! $('body').attr('data-user-role') ){
                var u = getData( appSwitchUserkey );
                if( u && u.role ){ 
                    $('body').addClass(u.role).attr('data-user-role',u.role );
                }else{
                    if( userInfo && userInfo.role )$('body').addClass(userInfo.role).attr('data-user-role',userInfo.role );
                }
            }
            
            //check if app should be locked
            check_for_locked_application();
            
            set_general_settings();
        }else{
            //signup
            $.mobile.navigate( "#signup", { transition : "none" });
        }
	}else{
		cannot_initiate_app();
	}
};

function check_for_locked_application(){
    var ld = new Date();
    var account = getData( lockIDkey );
    var inactive_account = 0;
    if( account && account.activation_status ){
        switch( account.activation_status ){
        case 'activated':
        break;
        case 'deactivated':
            inactive_account = 1;
        break;
        default:
            if( ld.getTime() > ( parseFloat( account.deactivation_date ) * 1000 ) ){
                inactive_account = 1;
                account.activation_status = 'deactivated';
                putData( lockIDkey , account );
                signOutUser();
            }
        break;
        }
    }
    
    if( inactive_account ){
        //display lock message on login screen
        $('#login-account-suspended-info').show();
        $.mobile.navigate( "#login", { transition : "none" });
    }
};

bind_shortcut_keys();
function bind_shortcut_keys(){
    $(document)
    .bind('keydown',function(e){
        switch(e.keyCode){
        case 117:	//F6
            e.preventDefault();
            $.mobile.navigate( "#switch-user", { transition : "none" });
        break;
        case 118:	//F7
            e.preventDefault();
        break;
        }
        
    });
};

function cannot_initiate_app(){
	if( deviceID ){
        var settings = {
            message_title:'Cannot Initiate App',
            message_message: 'Please try signing in again. \nIf problem persists please contact our customer care',
            auto_close: 'no'
        };
        clearData();
    }else{
        var settings = {
            message_title:'Please Login / Sign-up to Initialize App',
            message_message: '',
            auto_close: 'no'
        };
    }
	display_popup_notice( settings );
    $.mobile.navigate( "#signup", { transition : "none" });
};

function validate( $element , unfocused ){
	var tit = "Error Title";
	var msg = "Error Msg";
	var err = false;
	
	if( $element.attr('data-validate') && $element.attr('required') ){
		switch( $element.attr('data-validate') ){
		case 'date':
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
			//var c = $element.val();
			//if( c.charAt(0) == '0' ){
                //err = true;
			//}
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

var $itemSelectBox;
var $allItemSelectBox;
var $categorySelectBox;
var selectItemOption = '<option value="">- Select Item -</option>';

var lastKey;

function generate_key(){
    var launch_date = new Date();
    var key = launch_date.getTime();
    
    if( lastKey && lastKey == key )++key;
    
    lastKey = key;
    
    var user = get_user_info();
    if( user && user.key ){
        key = user.key + key;
    }
    return key;
};

function store_record( data ){
    //console.log(data);
	if( data.object ){
		var launch_date = new Date();
		var key = generate_key();
		
        var perm_storage = true;
		
        if( data.temp )perm_storage = false;
        
		switch( data.object ){
		case 'inventory':
			//use barcode as key
			if( data.item_barcode ){
				key = customUUID + data.item_barcode;
				data.key = customUUID + data.item_barcode;
			}
            
			//if( ! data.sales )data.sales = {};
			if( ! data.store ){
                data.store = {};
                data.store[currentStoreID] = {
                    'sales':{},
                    'damages':{},
                    'stock':{},
                    'cost_price': 0,
                    'expiry_date': '',
                    'income': 0,
                    'item_available': 0,
                    'item_qty': 0,
                    'item_sold': 0,
                    'selling_price': 0,
                    'item_damaged': 0,
                };
            }
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
			data.store_id = currentStoreID;
            perm_storage = false;
		break;
		case 'transferstock':
			perm_storage = false;
		break;
		case 'customers':
            //use app key to identify customers across all stores
            if( data.customer_mobile )
                data.key = 'c' + customUUID + data.customer_mobile;
		break;
		case 'generalsettings':
            key = 'gs'+key;
		break;
		}
		
		var d = {};
		
		if( data.key ){
			key = data.key;
			var d = getData( key );
		}else{
            //use user key to identify records created by users
			data.key = key;
		}
		
		data.timestamp = launch_date.getTime();
		if( d && d.creationtimestamp ){
			$.each( data , function(k, v){
                d[k] = v;
            });
            data = d;
		}else{
			data.creationtimestamp = data.timestamp;
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
	
	if( appUserID ){
		storeObjects[ 'user_info' ] = getData( appUserID );
		return storeObjects[ 'user_info' ];
	}
	
	clearData();
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
                internetConnection = true;
                
				post_form_data( $(this) );
				tempData = data;
			}
			
			if( local_store ){
				//store data
				var stored = store_record( data );
				successful_submit_action( stored );
				
				$form
				.find('input')
                .not('.do-not-clear')
				.val('');
			}
		}
		
		return false;
	});
};

function post_form_data( $me ){
	ajax_data = $me.serialize();
    
    var user = get_user_info();
    
    if( user && user.key ){
        ajax_data += '&app_user_id='+user.key;
        ajax_data += '&store_id='+currentStoreID;
        ajax_data += '&store_owner_id='+customUUID;
    }
    
    if( customUUID ){
        ajax_data += '&app_uid='+customUUID;
    }
        
	form_method = 'post';
	ajax_data_type = 'json';
	ajax_action = 'request_function_output';
	ajax_container = $('#login-form');
	ajax_get_url = $me.attr('action');
	ajax_send();
};

var newInventory = {};
var newStock = {};
var uploadImages = {};

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
        
        if( $('#supplier-select-box') ){
            $('#supplier-select-box')
            .selectmenu('refresh');
        }
	break;
	case 'customers':
		add_to_list_of_customers( stored );
        update_customers_list_on_customers_page();
        
		var upload = {};
		upload[ stored.key ] = stored.key;
		queueUpload( upload );
	break;
	case 'generalsettings':
		appSettings = {};
        set_general_settings();
        
		var upload = {};
		upload[ stored.key ] = stored.key;
		queueUpload( upload );
	break;
	case 'payments':
		var upload = {};
        
        if( stored.customer ){
            var upload = {};
            var customer = getData( stored.customer );
            if( customer.key ){
                if( ! customer.payments )customer.payments = {};
                
                customer.payments[ stored.key ] = stored.key;
                putData( customer.key , customer );
                
                upload[ customer.key ] = customer.key;
            }
            
            upload[ stored.key ] = stored.key;
            queueUpload( upload );
            
            update_customers_debt_list_on_customers_page( stored );
        }else{
            if( stored.object ){
                var object = getData( stored.object );
                if( object && object[stored.key] ){
                    delete object[stored.key];
                    putData( stored.object , object );
                }
            }
            
            clearSingleData( stored.key );
            
            title = 'Invalid Customer';
            msg = 'Could not find the customer\'s record';
        }
	break;
	case 'supplierpayments':
		var upload = {};
        
        if( stored.supplier ){
            var upload = {};
            var supplier = getData( stored.supplier );
            if( supplier.key ){
                if( ! supplier.payments )supplier.payments = {};
                
                supplier.payments[ stored.key ] = stored.key;
                putData( supplier.key , supplier );
                
                upload[ supplier.key ] = supplier.key;
            }
            
            upload[ stored.key ] = stored.key;
            queueUpload( upload );
            
            update_suppliers_debt_list_on_suppliers_page( stored );
        }else{
            clearSingleData( stored.key );
            title = 'Invalid Supplier';
            msg = 'Could not find the Supplier\'s record';
        }
	break;
	case 'expenses':
		var expenses_list = add_to_list_of_expenses( stored );
        add_to_daily_cache( stored );
		//update_expenses_list_on_expenses_page();
		
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
		update_users_list_on_users_page( "#mngusers" );
			
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
				street:'My Street Addr.',
				city:'My City',
				state:'My State',
				country:'My Country',
				object:'stores',
				users: {}
			};
			
			stores = store_record( store );
			
			var stores_list = add_to_list_of_stores( stores );
			
			var upload = {};
			upload[ stores.key ] = stores.key;
			queueUpload( upload );
			
			//$.mobile.navigate( "#dashboard", { transition : "none" });
            appSettings = {};
            set_general_settings();
		}
	break;
	case 'inventory':
		//add - ! (item desc | barcode | cateogry | location ) to stock_level object 
		title = 'Stored!';
		msg = 'Inventory successfully created';
		
        //console.log(stored);
		add_to_list_of_inventory( stored );
		update_inventory_list_on_inventory_page();
		
		var upload = {};
		upload[ stored.key ] = stored.key;
		queueUpload( upload );
        
        if( uploadImages ){
            //store upload images
            queueUploadImages( uploadImages );
            uploadImages = {};
        }
        
        $('#newInventory')
        .find('select#item-select-field')
        .val('new')
        .change()
        .selectmenu('refresh');
    
	break;	
	case 'stock':
		//add - ! (item desc | barcode | cateogry | location ) to stock_level object 
        var r = successful_submit_stock_form( stored );
        if( r && r.title )title = r.title;
        if( r && r.msg ) msg = r.msg;
        
        //console.log( 't', tempStoreObjects );
        $('#stock-form')
        .find('select#supplier-field')
        .selectmenu('refresh');
	break;
	case 'supply':
		if( newStock && Object.getOwnPropertyNames(newStock).length && tempStoreObjects && Object.getOwnPropertyNames(tempStoreObjects).length ){
			
            add_to_list_of_supply( stored );
            add_to_daily_cache( stored );
            
			stored.total_amount = parseFloat( stored.total_amount );
            if( ! stored.total_amount )stored.total_amount = 0;
            
			stored.total_amount_paid = parseFloat( stored.total_amount_paid );
            if( ! stored.total_amount_paid )stored.total_amount_paid = 0;
			
			stored.total_items = parseFloat( stored.total_items );
            if( ! stored.total_items )stored.total_items = 0;
			
            if( newStock.stock )stored.stock = newStock.stock;
            
            if( tempStoreObjects[ stored.key ] )
                tempStoreObjects[ stored.key ] = stored;
            
			var amount_owed = stored.total_amount - stored.total_amount_paid;
			
			var obj = {};
			var uploadDataset = {};
			
			if( ! storeObjects[ 'inventory_list' ] ){
				storeObjects[ 'inventory_list' ] = {};
			}
			if( ! storeObjects[ 'suppliers_list' ] ){
				storeObjects[ 'suppliers_list' ] = {};
			}
			if( ! storeObjects[ 'expenses_list' ] ){
				storeObjects[ 'expenses_list' ] = {};
			}
			
			//store temp object
			$.each( tempStoreObjects, function ( key , val ){
				uploadDataset[ key ] = key;
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
					case 'expenses':
						storeObjects[ 'expenses_list' ][ key ] = val;
                        add_to_list_of_expenses( val );
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
			queueUpload( uploadDataset );
			tempStoreObjects = {};
			newStock = {};
			uploadDataset = {};
            
            ga( 'send' , 'pageview' , {'page': '/supply' , 'title': msg } );
		}else{
			delete tempStoreObjects[ stored.key ];
			
			title = 'No Items were Supplied!';
			msg = 'Please add items to stock first';
		}
        
        $('#recently-stocked-items')
        .html('');
	break;
	case 'damages':
        var error = true;
		if( stored.item_barcode && stored.store_name ){
            add_to_daily_cache( stored );
            
            var inventory = getData( stored.item_barcode );
            
            if( inventory && inventory.store && inventory.store[stored.store_name] ){
                
                var store = inventory.store[stored.store_name];
                if( ! store )store = {};
                if( ! store.damages )store.damages = {};
                if( ! store.item_damaged )store.item_damaged = 0;
                
                store.damages[ stored.key ] = stored.key;
                store.item_damaged += parseFloat( stored.damage_qty );
                
                inventory.store[stored.store_name] = store;
                
                putData( stored.item_barcode , inventory );
                
                var damages_list = add_to_list_of_damages( stored );
                add_to_list_of_inventory( inventory );
                
                var upload = {};
                upload[ stored.key ] = stored.key;
                queueUpload( upload );
                
                error = false;
            }
        }
        
        if( error ){
            if( stored.object ){
                var object = getData( stored.object );
                if( object && object[stored.key] ){
                    delete object[stored.key];
                    putData( stored.object , object );
                }
            }
            
            clearSingleData( stored.key );
            title = 'Invalid Item / Store';
            msg = 'Could not log damage report';
        }
	break;
	case 'transferstock':
        var error = true;
        if( stored.origin_store_name && stored.store_name && stored.item_barcode && stored.transfer_qty ){
            stored.transfer_qty = parseFloat( stored.transfer_qty );
            
            if( stored.origin_store_name == stored.store_name ){
                error = false;
                title = 'Stock Transfer Failed';
                msg = 'Originating Store and Destination Store must be different';
            }else{
                var inventory = getData( stored.item_barcode );
                if( inventory && inventory.store && inventory.store[stored.origin_store_name] && inventory.store[stored.origin_store_name].stock ){
                    if( ! inventory.store[stored.store_name] )inventory.store[stored.store_name] = {};
                    
                    var origin_stock = inventory.store[stored.origin_store_name].stock;
                    console.log('os',origin_stock);
                    $.each( origin_stock, function( k , v ){
                        var stock = getData( k );
                        if( stock && stock.store_name && stock.store_name == stored.origin_store_name ){
                            
                            stock.item_qty = parseFloat( stock.item_qty );
                            
                            if( stored.transfer_qty > stock.item_qty ){
                                
                            }else{
                                var new_stock = stock;
                                new_stock.key = '';
                                new_stock.id = '';
                                new_stock.store_name = stored.store_name;
                                new_stock.item_qty = stored.transfer_qty;
                                new_stock.creationtimestamp = 0;
                                new_stock.timestamp = 0;
                                
                                var new_stored = store_record( new_stock );
                                if( new_stored && new_stored.key && tempStoreObjects[ new_stored.key ] ){
                                    delete tempStoreObjects[ new_stored.key ];
                                    
                                    stock.item_qty = stock.item_qty - stored.transfer_qty;
                                    putData( k , stock );
                                    
                                    putData( new_stored.key , new_stored );
                                    
                                    if( ! inventory.store[stored.store_name].item_qty )inventory.store[stored.store_name].item_qty = 0;
                                    if( ! inventory.store[stored.store_name].item_sold )inventory.store[stored.store_name].item_sold = 0;
                                    if( ! inventory.store[stored.store_name].income )inventory.store[stored.store_name].income = 0;
                                    if( ! inventory.store[stored.store_name].item_damaged )inventory.store[stored.store_name].item_damaged = 0;
                                    if( ! inventory.store[stored.store_name].item_available )inventory.store[stored.store_name].item_available = 0;
                                    if( ! inventory.store[stored.store_name].stock )inventory.store[stored.store_name].stock = {};
                                    if( ! inventory.store[stored.store_name].expiry_date )inventory.store[stored.store_name].expiry_date = inventory.store[stored.origin_store_name].expiry_date;
                                    if( ! inventory.store[stored.store_name].cost_price )inventory.store[stored.store_name].cost_price = inventory.store[stored.origin_store_name].cost_price;
                                    if( ! inventory.store[stored.store_name].selling_price )inventory.store[stored.store_name].selling_price = inventory.store[stored.origin_store_name].selling_price;
                                    if( ! inventory.store[stored.store_name].sales )inventory.store[stored.store_name].sales = {};
                                    
                                    inventory.store[stored.store_name].stock[ new_stored.key ] = new_stored.key;
                                    inventory.store[stored.store_name].item_available += stored.transfer_qty;
                                    inventory.store[stored.store_name].item_qty += stored.transfer_qty;
                                    
                                    inventory.store[stored.origin_store_name].item_available -= stored.transfer_qty;
                                    inventory.store[stored.origin_store_name].item_qty -= stored.transfer_qty;
                                    putData( stored.item_barcode , inventory );
                                
                                    error = false;
                                    
                                    return;
                                }
                                
                            }
                        }
                        
                    } );
                }
            }
        }
        
        if( tempStoreObjects && tempStoreObjects[stored.key] ){
            delete tempStoreObjects[stored.key];
        }
        
        if( error ){
            title = 'Stock Transfer Failed';
            msg = 'Could not transfer stock';
        }
    break;
	case 'sales':
		var newSale = {};
		$.each( stored.inventory , function( key , value ){
			var inventory = getData( key );
			/*might be removed*/
			if( stored.store_name && inventory && inventory.store && inventory.store[ stored.store_name ] ){
			
            var tmp_store_data = inventory.store[ stored.store_name ];
            
			if( tmp_store_data.item_sold ){
				tmp_store_data.item_sold += value.unit_ordered;
				tmp_store_data.income += value.unit_selling_price;
			}else{
				tmp_store_data.item_sold = value.unit_ordered;
				tmp_store_data.income = value.unit_selling_price;
			}
			
			if( tmp_store_data.sales && Object.getOwnPropertyNames( tmp_store_data.sales ).length && typeof tmp_store_data.sales === 'object' && ! ( tmp_store_data.sales instanceof Array ) ){
				tmp_store_data.sales[ stored.key ] = stored.key;
			}else{
				tmp_store_data.sales = {};
				tmp_store_data.sales[ stored.key ] = stored.key;
			}
            
			inventory.store[ stored.store_name ] = tmp_store_data;
            
			putData( key , inventory );
			
            if( ! storeObjects[ 'inventory_list' ] )storeObjects[ 'inventory_list' ] = {};
            storeObjects[ 'inventory_list' ][ key ] = inventory;
			
			newSale[ inventory.key ] = inventory.key;
			}
		});
		
        add_to_daily_cache( stored );
        
		newSale[ stored.key ] = stored.key;
		queueUpload( newSale );
		storeObjects[ 'sales' ][ stored.key ] = stored;
		
        title = 'Sold!';
        msg = "\n" + 'Sales ID: #' + stored.key + "\n" + 'Total Items: ' + stored.total_units + "\n" + 'Net Total: ' + appCurrencyText +' '+formatNum(stored.total_amount.toFixed(2));
        
        if( dataUploadTimerID )clearTimeout( dataUploadTimerID );
        dataUploadTimerID = setTimeout( uploadData, appTimeToUploadData * 1000 );
        
        ga( 'send' , 'pageview' , {'page': '/sale' , 'title': '#'+stored.key } );
	break;
	}
	
	var settings = {
		message_title:title,
		message_message: msg,
		auto_close: 'yes'
	};
	display_popup_notice( settings );
};

function successful_submit_stock_form( stored ){
    title = 'Stocked!';
    msg = '';
    
    var date = new Date();

    var day = date.getDate();
    var month = date.getMonth();
    var year = date.getFullYear();
    //var hours = date.getHours();
    //var minutes = date.getMinutes();
    
    var current_date = year+'-'+months_of_year[ month ]+'-'+day;

    if( stored.store_name ){
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
                
                var tmp_store_data = {
                    stock: {},
                    selling_price:0,
                    cost_price:0,
                    item_qty:0,
                    item_available:0,
                    item_sold:0,
                    item_damaged:0,
                    income:0,
                    damages:{},
                    sales: {},
                };
                if( inventory ){
                    if( ! inventory.store ){
                        inventory.store = {};
                    }else{
                        if( inventory.store[ stored.store_name ] ){
                            tmp_store_data = inventory.store[ stored.store_name ];
                        }
                    }
                    
                    //check stored data
                    $.each( tmp_store_data, function( k , v ){
                        if( k == 'stock' ){
                            if( ! v )tmp_store_data[k] = {};
                        }else{
                            if( ! v )tmp_store_data[k] = 0;
                        }
                    });
                    
                    tmp_store_data.cost_price = parseFloat( stored.cost_price );
                    tmp_store_data.selling_price = parseFloat( stored.selling_price );
                    tmp_store_data.expiry_date = stored.expiry_date;
                    
                    tmp_store_data.item_qty += parseFloat( stored.item_qty );
                    
                    tmp_store_data.item_available = tmp_store_data.item_qty - tmp_store_data.item_sold;
                    
                    tmp_store_data.stock[ stored.key ] = stored.key;
                    
                    inventory.store[ stored.store_name ]  = tmp_store_data;
                    tmp_store_data = {};
                    
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
                    
                    //create expense
                    var tmp_expense_data = {
                        key: 'e'+stored.key,
                        amount: parseFloat( stored.cost_price * stored.item_qty ),
                        date:current_date,
                        description: "Procurement of "+inventory.item_desc+" "+parseFloat( stored.item_qty )+" unit(s)",
                        object:"expenses",
                        type:"purchase of goods",
                        item_id:inventory.key,
                        store_id:stored.store_name,
                        store_name:stored.store_name,
                        temp:true,
                    };
                    store_record( tmp_expense_data );
                    
                    /*perform on save operation
                    if( ! storeObjects[ 'suppliers_list' ] ){
                        storeObjects[ 'suppliers_list' ] = {};
                    }
                    
                    storeObjects[ 'suppliers_list' ][ stored.supplier ] = supplier;
                    */
                    
                    if( ! newStock.total_items ){
                        newStock.total_items = 0;
                        newStock.total_amount = 0;
                        newStock.total_amount_paid = 0;
                        newStock.stock = {};
                    }
                    
                    newStock.key = stored.supply;
                    
                    newStock.total_items += parseFloat( stored.item_qty );
                    newStock.total_amount += ( stored.cost_price * stored.item_qty );
                    newStock.total_amount_paid = 0;
                    newStock.stock[stored.key] = stored.key;
                    
                    updateSupplyFormFields( newStock );
                    
                    $('#recently-stocked-items')
                    .append( '<span class="bubble-label">'+inventory.item_desc+' ('+stored.item_qty+')'+' ['+inventory.item_barcode+']</span> ' );
                }
            }else{
                //delete stored data
                delete tempStoreObjects[ stored.key ];
                
                title = 'Invalid Supplier!';
                msg = 'Please select a supplier or create one if none exists';
            }
        }
    }else{
        title = 'Invalid Store!';
        msg = 'Please select a store or create one if none exists';
    }
	
    return {title:title, msg:msg };
};
        
function add_to_daily_cache( data ){
    if( data && data.object && data.timestamp && data.key ){
        var date = new Date( data.timestamp );
        // hours part from the timestamp
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        
        if( day < 10 )day = '0'+day;
        var m2 = month + 1;
        if(  m2 < 10 )var m1 = '0'+m2;
        else var m1 = m2;
        
        var k = data.object + year + '-' + m1 + '-' + day;
        var daily = getData( k );
        if( ! daily )daily = {};
        daily[ data.key ] = data.key;
        putData( k , daily );
    }
};

function leftandRight( text , txtRight ){
    if( appPrinterCharacterLength )
        var length = appPrinterCharacterLength;
    else
        var length = 24;
        
    var tlen = 0;
    
    txtRight = txtRight.toString();
    
    if( ! txtRight ){
        return text+"\n";
    }
    if( text )tlen = text.length;
    else tlen = 0;
    
    var spacer1 = ' ';
    var maxlen = parseInt( length / 2 );
    
    if( tlen > maxlen+1 ){
        text = text.substring( 0 , maxlen );
        text += ': ';
        tlen = text.length;
    }else{
        for( var i = 0; i < ( maxlen - tlen ) + 3; i++ ){
            spacer1 += ' ';
        }
        tlen = maxlen + 1;
    }
    
    var spacer = ' ';
    if( tlen < txtRight.length ){
        for( var i = 0; i < maxlen; i++ ){
            spacer += ' ';
        }
        return text + spacer1 + "\n" + spacer  + txtRight + "\n";
    }
    
    for( var i = 0; i < tlen - txtRight.length; i++ ){
        spacer += ' ';
    }
    
    return text + spacer1 + spacer + txtRight + "\n";
};

function leftandRightHTML( text , txtRight ){
    return '<span style="float:left; width:49%; overflow:hidden; text-overflow:ellipisis; white-space:nowrap;">' + text +':</span>&nbsp;<span style="float:right; text-align:right; width:49%; overflow:hidden; text-overflow:ellipisis; white-space:nowrap;">'+ txtRight + "</span><br />";
};

function formatReceiptText( sales_data ){
    
    var dash = "----------------------------";
    if( appPrinterSeperatorLength ){
        dash = "";
        for(var i= 0; i < appPrinterSeperatorLength; i++ ){
            dash += "-";
        }
    }
    
    var space = "\n\n";
    var space_single = "\n";
    
    var store_details = space + "SALES RECEIPT" + space_single + dash + space_single;
    
    if( currentStoreID ){
        var store = getData( currentStoreID );
        if( store && Object.getOwnPropertyNames(store).length ){
            if( store.name ){
                store_details += store.name + space_single;
            }
            
            if( store.street ){
                store_details += store.street;
                if( store.city )store_details += ', '+ store.city;
                store_details += space_single;
            }
            
            if( store.country ){
                if( store.state )store_details += store.state + ', ';
                store_details += store.country + space_single;
            }
            store_details += dash + space_single;
        }
    }
    
    var date = new Date();
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
    
    store_details += "Receipt Number: " + space_single + '#'+sales_data.key + space_single + dash + space_single;
    
	store_details += leftandRight( "Date: " , year+'-'+months_of_year[ month ]+'-'+day );
	store_details += leftandRight( "Time: " , hours+':'+minutes );
    
    var user = get_user_info();
    
    if( sales_data && sales_data.key ){
        //user
        if( user && user.name ){
            store_details += leftandRight( "Sales Rep: " , user.name );
        }
        store_details += dash + space_single;
        
        if( sales_data.inventory ){
            $.each( sales_data.inventory , function( k , s ){
                store_details += get_item_row_for_sales_records_striped( s );
                if( k )store_details += k + " \n";
            });
            
            store_details += space_single;
        }
        
        store_details += leftandRight( 'Total Items: ' , sales_data.total_units );
        store_details += leftandRight( 'Total: ' , appCurrencyText +' '+formatNum(sales_data.subtotal.toFixed(2)) );
        store_details += leftandRight( 'VAT: ' , appCurrencyText +' '+formatNum(sales_data.vat.toFixed(2)) );
        store_details += leftandRight( 'Discount: ' , appCurrencyText +' '+formatNum(sales_data.discount.toFixed(2)) );
        store_details += leftandRight( 'Net Total: ' , appCurrencyText +' '+formatNum(sales_data.total_amount.toFixed(2)) );
        
        var change = sales_data.total_amount_tendered - sales_data.total_amount;
        var lblChange = "Change";
        if( change < 0 ){
            change = Math.abs( change );
            lblChange = "Debt";
        }
        store_details += dash + space_single;
        store_details += leftandRight( 'Paid: ' , appCurrencyText +' '+formatNum(sales_data.total_amount_tendered.toFixed(2)) );
        store_details += leftandRight( lblChange+': ' , appCurrencyText + ' ' + formatNum(change.toFixed(2)) );
        store_details += dash + space_single;
        
        if( sales_data.customer ){
            var c = getData( sales_data.customer );
            if( c && c.customer_name ){
                store_details += leftandRight( 'Cus: ' , c.customer_name );
                store_details += leftandRight( 'Tel: ' , c.customer_mobile );
                store_details += dash + space_single;
            }
        }
        
        store_details += space_single;
        if( appSettings && appSettings.receipt_message ){
            store_details += appSettings.receipt_message + space;
            store_details += dash + space_single;
        }
        
        store_details += 'BLUBIRD v'+appVersionNumber;
        store_details += space + space + space;
    }
    
    return store_details;
};

function formatReceiptHTML( sales_data ){
    var dash = "<hr />";
    
    var appCurrencyTextPrint = appCurrency;
    
    var space = "<br /><br />";
    var space_single = "<br />";
    
    var store_details = space + "SALES RECEIPT" + space_single + dash + space_single;
    
    if( currentStoreID ){
        var store = getData( currentStoreID );
        if( store && Object.getOwnPropertyNames(store).length ){
            if( store.name ){
                store_details += store.name + space_single;
            }
            
            if( store.street ){
                store_details += store.street;
                if( store.city )store_details += ', '+ store.city;
                store_details += space_single;
            }
            
            if( store.country ){
                if( store.state )store_details += store.state + ', ';
                store_details += store.country + space_single;
            }
            store_details += dash + space_single;
        }
    }
    
    var date = new Date();
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
    
    store_details += "Receipt Number: " + space_single + '#'+sales_data.key + space_single + dash + space_single;
    
	store_details += leftandRightHTML( "Date: " , year+'-'+months_of_year[ month ]+'-'+day );
	store_details += leftandRightHTML( "Time: " , hours+':'+minutes );
    
    var user = get_user_info();
    
    if( sales_data && sales_data.key ){
        //user
        if( user && user.name ){
            store_details += leftandRightHTML( "Sales Rep: " , user.name );
        }
        store_details += dash + space_single;
        
        if( sales_data.inventory ){
            $.each( sales_data.inventory , function( k , s ){
                store_details += get_item_row_for_sales_records_stripedHTML( s );
            });
            
            store_details += space_single;
        }
        
        store_details += leftandRightHTML( 'Total Items: ' , sales_data.total_units );
        store_details += leftandRightHTML( 'Total: ' , appCurrencyTextPrint +' '+formatNum(sales_data.subtotal.toFixed(2)) );
        store_details += leftandRightHTML( 'VAT: ' , appCurrencyTextPrint +' '+formatNum(sales_data.vat.toFixed(2)) );
        store_details += leftandRightHTML( 'Discount: ' , appCurrencyTextPrint +' '+formatNum(sales_data.discount.toFixed(2)) );
        store_details += leftandRightHTML( 'Net Total: ' , appCurrencyTextPrint +' '+formatNum(sales_data.total_amount.toFixed(2)) );
        
        var change = sales_data.total_amount_tendered - sales_data.total_amount;
        var lblChange = "Change";
        if( change < 0 ){
            change = Math.abs( change );
            lblChange = "Debt";
        }
        store_details += dash + space_single;
        store_details += leftandRightHTML( 'Paid: ' , appCurrencyTextPrint +' '+formatNum(sales_data.total_amount_tendered.toFixed(2)) );
        store_details += leftandRightHTML( lblChange+': ' , appCurrencyTextPrint + ' ' + formatNum(change.toFixed(2)) );
        store_details += dash + space_single;
        
        if( sales_data.customer ){
            var c = getData( sales_data.customer );
            if( c && c.customer_name ){
                store_details += leftandRightHTML( 'Customer: ' , c.customer_name );
                store_details += leftandRightHTML( 'Phone No: ' , c.customer_mobile );
                store_details += dash + space_single;
            }
        }
        
        store_details += space_single;
        if( appSettings && appSettings.receipt_message ){
            store_details += appSettings.receipt_message + space;
            store_details += dash + space_single;
        }
        
        store_details += 'BLUBIRD v'+appVersionNumber;
        store_details += space + space + space;
    }
    
    return store_details;
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

function add_to_list_of_supply( data ){
	if( storeObjects[ 'supply' ] ){
		storeObjects[ 'supply' ];
	}else{
		get_list_of_supply();
	}
	
	storeObjects[ 'supply' ][ data.key ] = data;
};

function add_to_list_of_customers( data ){
	if( storeObjects[ 'customers_list' ] ){
		storeObjects[ 'customers_list' ];
	}else{
		get_list_of_customers();
	}
	
	storeObjects[ 'customers_list' ][ data.key ] = data;
};

function add_to_list_of_expenses( data ){
	if( storeObjects[ 'expenses_list' ] ){
		storeObjects[ 'expenses_list' ];
	}else{
		get_list_of_expenses();
	}
	
	storeObjects[ 'expenses_list' ][ data.key ] = data;
	/*
	$( '#expenses-list-container' )
	.find('#'+data.key)
	.remove();
	*/
    
	$( '#expenses-list-container' )
	.prepend( get_expenses_html( data.key , data ) );
};

function add_to_list_of_damages( data ){
	if( storeObjects[ 'damages_list' ] ){
		storeObjects[ 'damages_list' ];
	}else{
		get_list_of_damages();
	}
	
	storeObjects[ 'damages_list' ][ data.key ] = data;
    
    if( data && data.item_barcode ){
        var inventory = getData( data.item_barcode );
        if( inventory && inventory.item_desc ){
            var date = new Date( data.timestamp );
        
            var day = date.getDate();
            var month = date.getMonth();
            var year = date.getFullYear();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            
            var q = 0;
            if( data.damage_qty )
                q = parseFloat( data.damage_qty );
            
            $('#damages')
            .find( 'tbody#damages-list-container' )
            .prepend( '<tr id="'+data.key+'" timestamp="'+data.timestamp+'"><td class="ui-table-priority-1">'+inventory.item_desc+'<br /><i style="font-size:0.7em;">occurred on: '+data.date+'</i></td><td class="ui-table-priority-3">'+data.damage_desc+'</td><td class="ui-table-priority-2">'+formatNum( q )+'</td><td class="ui-table-priority-4">'+year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes+'</td></tr>' );
        }
    }
};

function get_list_of_expenses(){
	if( storeObjects[ 'expenses_list' ] ){
		storeObjects[ 'expenses_list' ];
	}else{
		var object = 'expenses';
		var keys = getData( object );
		var expenses_list = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				expenses_list[ key ] = getData( key );
			});
		}
		
		storeObjects[ 'expenses_list' ] = expenses_list;
	}
	return storeObjects[ 'expenses_list' ];
};

function get_list_of_damages(){
	if( storeObjects[ 'damages_list' ] ){
		storeObjects[ 'damages_list' ];
	}else{
		var object = 'damages';
		var keys = getData( object );
		var damages_list = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				damages_list[ key ] = getData( key );
			});
		}
		
		storeObjects[ 'damages_list' ] = damages_list;
	}
	return storeObjects[ 'damages_list' ];
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

function get_list_of_supply(){
	if( storeObjects[ 'suppply' ] ){
		storeObjects[ 'supply' ];
	}else{
		var object = 'supply';
		var keys = getData( object );
		var suppliers_list = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				suppliers_list[ key ] = getData( key );
			});
		}
		
		storeObjects[ 'supply' ] = suppliers_list;
		
	}
	return storeObjects[ 'supply' ];
};

function get_list_of_customers(){
	if( storeObjects[ 'customers_list' ] ){
		storeObjects[ 'customers_list' ];
	}else{
		var object = 'customers';
		var keys = getData( object );
		var customers_list = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				customers_list[ key ] = getData( key );
			});
		}
		
		storeObjects[ 'customers_list' ] = customers_list;
		
	}
	return storeObjects[ 'customers_list' ];
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
	if(  value.item_damaged )qty -= parseFloat( value.item_damaged );
    
	if( ! value.item_image )value.item_image = '';
	
    var low_stock_class = '';
    if( qty <= appLowStockLevel )low_stock_class = ' low-stock';
    
    var img = blubirdFileURL + value.item_image;
    if( value.image && value.item_image == value.image ){
        img = 'imagebank/'+value.item_image;
    }
    if( blubirdWebbased ){
        img = 'imagebank/'+value.item_image;
    }
   
    var d_qty = formatNum( qty );
    if( value.item_stock_type && value.item_stock_type == 'on' ){
        low_stock_class = '';
        d_qty = '&#8734;';
    }
    
	var html = '<tr id="'+key+'" class="'+value.category+low_stock_class+'" timestamp="'+value.timestamp+'"><td class="ui-table-priority-2 image-container"><img src="' + img + '" class="ui-li-thumb" /></td><td>'+value.item_desc+'<br /><span style="font-size:0.8em;">['+value.item_barcode+']</span></td><td class="ui-table-priority-1">'+d_qty+'</td><td class="ui-table-priority-3">'+formatNum( value.selling_price )+'</td>';
	
    html += '<td class="ui-table-priority-4">';
	if( value.supplier ){
        var supply = getData( value.supplier );
        if( supply && supply.supplier ){
            var sup = getData( supply.supplier );
            if( sup && sup.supplier ){
                html += '<a href="tel:'+sup.mobile+'" data-role="button" data-mini="true" data-theme="a" data-icon="phone" class="ui-link ui-btn ui-btn-a ui-icon-phone ui-btn-icon-left ui-shadow ui-corner-all ui-mini"><b>'+sup.supplier+'</b></a>';
            }
        }
	}
    html += '</td>';
	html += '</tr>';
	
	return html;
};

function get_new_inventory_html( key , value ){
	var date = new Date( value.timestamp );
	
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	
    if( ! value.item_image )value.item_image = '';
    
    var img = blubirdFileURL + value.item_image;
    if( value.image && value.item_image == value.image ){
        img = 'imagebank/'+value.item_image;
    }
    if( blubirdWebbased ){
        img = 'imagebank/'+value.item_image;
    }
	return '<tr id="'+key+'" class="'+value.category+'" timestamp="'+value.timestamp+'"><td class="ui-table-priority-1 image-container"><img src="'+ img +'" class="ui-li-thumb"></td><td>'+value.item_desc+'<br /><span style="font-size:0.8em;">['+value.item_barcode+']</span></td><td class="ui-table-priority-2">'+year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes+'</td></tr>';
};

function get_inventory_set_pricing_html( key , value ){
	if( ! value.cost_price )cp  = 0;
	else cp = parseFloat( value.cost_price );
	
	var qty = 0;
	if(  value.item_qty )qty = parseFloat( value.item_qty );
	if(  value.item_sold )qty -= parseFloat( value.item_sold );
    if(  value.item_damaged )qty -= parseFloat( value.item_damaged );
    
	if( ! value.item_image )value.item_image = '';
    
    var img = blubirdFileURL + value.item_image;
    if( value.image && value.item_image == value.image ){
        img = 'imagebank/'+value.item_image;
    }
    if( blubirdWebbased ){
        img = 'imagebank/'+value.item_image;
    }
	
    var d_qty = formatNum( qty );
    if( value.item_stock_type && value.item_stock_type == 'on' ){
        d_qty = '&#8734;';
    }
    
    return '<tr id="'+key+'" class="'+value.category+'" timestamp="'+value.timestamp+'"><td class="ui-table-priority-3 image-container"><img src="'+ img +'" class="ui-li-thumb"></td><td>'+value.item_desc+'<br /><span style="font-size:0.8em;">['+value.item_barcode+']</span></td><td class="ui-table-priority-2">'+d_qty+'</td><td class="ui-table-priority-4">'+formatNum( cp.toFixed(2) )+'</td><td class="ui-table-priority-1"><div class="ui-input-text ui-body-inherit ui-corner-all ui-shadow-inset"><input type="number" min="0" step="any" value="'+value.selling_price+'" default-value="'+value.selling_price+'" item="'+value.item_desc+'" class="inventory-pricing-input" key="'+key+'" cost-price="'+value.cost_price+'" /></div></td></tr>';
};

function get_supplier_html( key , value ){
	var date = new Date( value.timestamp );
	
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	
	return '<tr id="'+key+'" timestamp="'+value.timestamp+'"><td>'+value.supplier+' ('+value.location+')</td><td class="ui-table-priority-2">'+year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes+'</td></tr>';
};

function get_expenses_html( key , value ){
	var date = new Date( value.timestamp );
	
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	
    var a = 0;
    if( value.amount )
        a = parseFloat( value.amount );
    
	return '<tr id="'+key+'" timestamp="'+value.timestamp+'"><td class="ui-table-priority-1">'+value.description+' <br /><i>incured on: '+value.date+'</i></td><td class="ui-table-priority-2">'+formatNum( a.toFixed(2) )+'</td><td class="ui-table-priority-3">'+year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes+'</td></tr>';
};

function get_damages_html( key , value ){
	
    var html = '';
    if( ! value.damages )return;
    
    $.each( value.damages , function( k , kk ){
        var v = getData( k );
        if( ! ( v && v.key ) )return false;
        
        var date = new Date( v.timestamp );
	
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        
        var q = 0;
        if( v.damage_qty )
            q = parseFloat( v.damage_qty );
        
        var desc = value.item_desc;
        
        html += '<tr id="'+key+'" timestamp="'+v.timestamp+'"><td class="ui-table-priority-1">'+desc+'<br /><i style="font-size:0.7em;">occurred on: '+v.date+'</i></td><td class="ui-table-priority-3">'+v.damage_desc+'</td><td class="ui-table-priority-2">'+formatNum( q )+'</td><td class="ui-table-priority-4">'+year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes+'</td></tr>';
    });
    return html;
};

function get_category_html( key , value ){
	var date = new Date( value.timestamp );
	
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	
	return '<tr id="'+key+'" timestamp="'+value.timestamp+'"><td>'+value.category+'</td><td class="ui-table-priority-2">'+year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes+'</td></tr>';
};

function get_users_html( key , value ){
	if( value.timestamp ){
        var date = new Date( value.timestamp );
        
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var hours = date.getHours();
        var minutes = date.getMinutes();
    
        var modified_date = year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes;
    }else{
        var modified_date = '';
	}
    var role = '';
	if( value.role )role = value.role.replace('-', ' ');
	
	return '<tr id="'+key+'" timestamp="'+value.timestamp+'"><td>'+value.name+'</td><td class="ui-table-priority-2">'+value.email+'</td><td class="ui-table-priority-1">'+role+'</td><td class="ui-table-priority-3">'+modified_date+'</td></tr>';
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
	return '<tr id="'+key+'" timestamp="'+value.timestamp+'"><td>'+value.name+'</td><td class="ui-table-priority-1">'+value.user+'</td><td class="ui-table-priority-2">'+year+'-'+months_of_year[ month ]+'-'+day+' '+hours+':'+minutes+'</td></tr>';
};

var ffs = null;

function activate_panel_navigation( $page ){
    $("#menupanel").panel().enhanceWithin();
};

function activate_menu(){
    var page_id = get_active_page_id();
    if( ! page_id )page_id = 'dashboard';
    
    if( page_id ){
        $("#menupanel")
        .find('a.active-menu')
        .removeClass('active-menu');
        
        $("#menupanel")
        .find('a[href="#'+page_id+'"]')
        .addClass('active-menu');
    }
};

$( document ).on( "pagecreate", "#dashboard", function() {
    test_for_active_user();
    activate_update_of_current_store( $("#dashboard") );
    activate_manual_upload_data_button_click_event( $("#dashboard") );
    
    activate_panel_navigation( $("#dashboard") );
    
    $('a.app-refresh-button')
    .on('click', function(e){
        e.preventDefault();
        document.location = document.location.origin + document.location.pathname + document.location.search;
    });
    
});

$(document).on("pagecontainerbeforechange",function(e, data){
    var to = data.toPage,
        from = data.options.fromPage;

    if (typeof to  === 'string') {
        var u = $.mobile.path.parseUrl(to);
        to = u.hash || '#' + u.pathname.substring(1);
        if (from) from = '#' + from.attr('id');
        
        switch(to){
        case '#signup': case '#login': case '#update-progress': case '#dashboard': case '#checkout': case '#switch-user': case '#settings': case '#my-profile': case '#general-settings': case '#restore-points':
            return true;
        break;
        }
        
        var user = getData( appSwitchUserkey );
        if( ! ( user && user.role ) )var user = get_user_info();
        
        if( ! ( user && user.role ) ){
            $.mobile.navigate( "#signup", { transition : "none" } );
            return true;
        }
        
        switch( user.role ){
        case 'sales-rep':
            switch(to){
            case '#sales':
            break;
            default:
                e.preventDefault();
                e.stopPropagation();
                
                // remove active status on buttons
                var $active = $.mobile.activePage
                .find('.ui-btn-active')
                .removeClass('ui-btn-active');
                
                switch(from){
                case '#sales': case '#dashboard': case '#checkout':
                break;
                default:
                    $.mobile.navigate( "#dashboard", { transition : "none" } );
                break;
                }
                
                var settings = {
                    message_title:'Unauthorized Access',
                    message_message: 'You cannot access the selected resource',
                };
                display_popup_notice( settings );
            break;
            }
        break;
        case 'stock-keeper':
            switch(to){
            case '#inventory': case '#supplier': case '#notifications': case '#restock': case '#newInventory': case '#setPricing': case '#damages': case '#refunds': case '#mngcategory':
            break;
            default:
                e.preventDefault();
                e.stopPropagation();
                
                // remove active status on buttons
                var $active = $.mobile.activePage
                .find('.ui-btn-active')
                .removeClass('ui-btn-active');
                
                switch(from){
                case '#dashboard': case '#inventory': case '#supplier': case '#notifications': case '#restock': case '#newInventory': case '#setPricing': case '#damages': case '#refunds': case '#mngcategory':
                break;
                default:
                    $.mobile.navigate( "#dashboard", { transition : "none" } );
                break;
                }
                
                var settings = {
                    message_title:'Unauthorized Access',
                    message_message: 'You cannot access the selected resource',
                };
                display_popup_notice( settings );
            break;
            }
        break;
        case 'manager':
            switch(to){
            case '#stores': case '#mngusers':
                e.preventDefault();
                e.stopPropagation();
                
                var settings = {
                    message_title:'Unauthorized Access',
                    message_message: 'You cannot access the selected resource',
                };
                display_popup_notice( settings );
            break;
            }
        break;
        case 'admin':
        break;
        }
        
    }
});

function initFileSystem( persistentFileSys ) {
  //conlog(persistentFileSys);
  persistentFileSys.root.getDirectory( 'blubirdimagebank', {create: true, exclusive: false}, function( persistentDirectory ) {
    blubirdFileURL = persistentDirectory.nativeURL;
    //alert(blubirdFileURL);
  }, fail);
};

$( document ).on( "pageshow", "#dashboard", function() {
	populate_stores_select_box( $('#dashboard').find('select.currently-active-store') );
	
    activate_menu();
    
    prepare_notifications_for_display(0);
    check_for_data_to_upload( $('#dashboard') );
    
	var inventory = get_list_of_inventory();
	
	var label = new Array();
	var values1 = new Array();
	var values2 = new Array();
	var i = 0;
	
	var total_value = 0;
	var total_items = 0;
    
    if( currentStoreID ){
        $.each( inventory , function( key , value ){
            if( ( value && value.store && value.store[ currentStoreID ] ) || ( value && value.item_stock_type && value.item_stock_type == 'on' ) ){
                value.item_qty = 0;
                value.item_damaged = 0;
                if( ! ( value.item_stock_type && value.item_stock_type == 'on' ) ){
                    var storeStock = value.store[ currentStoreID ];
                    if( ! storeStock.item_sold )storeStock.item_sold = 0;
                    if( ! storeStock.item_damaged )storeStock.item_damaged = 0;
                    
                    value.item_qty = storeStock.item_qty;
                    value.item_sold = storeStock.item_sold;
                    value.selling_price = storeStock.selling_price;
                    value.item_damaged = storeStock.item_damaged;
                }
                
                tv = ( parseFloat( value.item_qty ) - ( parseFloat( value.item_sold ) + parseFloat( value.item_damaged ) ) )* value.selling_price;
                if( tv > 0 )total_value += tv;
                
                ti = ( parseFloat( value.item_qty ) - ( parseFloat( value.item_sold ) + parseFloat( value.item_damaged ) ) );
                if( ti > 0 )total_items += ti;
                
                label[i] = value.item_desc;
                values2[i] = value.item_qty;
                values1[i] = value.item_sold;
                ++i;
            }
        });
	}
	
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
	var today = date.getFullYear() + '-' + months_of_year[ date.getMonth() ] + '-' + date.getDate();
	var today_total_days = 0;
	var today_cost_price_days = 0;
	
	var today_units = 0;
	
	var most_selling = {};
	var most_selling_count = 0;
    
	var current_timestamp = date.getTime();
	var week_timestamp = current_timestamp - (7*24*3600000);
	
	var week_data = {};
	
    if( currentStoreID ){
        $.each( sales , function( key , value ){
            if( value && value.store_name == currentStoreID ){
                if( value.subtotal )total_value += parseFloat( value.subtotal );
                if( value.vat )total_vat += parseFloat( value.vat );
                
                if( value.total_units )total_items += parseFloat( value.total_units );
                if( value.total_cost_price )total_cost_price += parseFloat( value.total_cost_price );
                
                var date = new Date(value.timestamp);
                // hours part from the timestamp
                var day = date.getDate();
                var month = date.getMonth();
                var year = date.getFullYear();
                
                value.day = year + '-' + months_of_year[ month ] + '-' + day;
                
                value.day_only = day;
                value.week_day = weekdays[ date.getDay() ];
                
                if( value.day == today ){
                    
                    today_total_days += parseFloat( value.total_amount );
                    today_cost_price_days += parseFloat( value.total_cost_price * 1 );
                    if( value.total_units )today_units += parseFloat( value.total_units );
                    
                    $.each( value.inventory , function( k, v){
                        if( v.key && v.item_desc ){
                            if( most_selling[ k ] ){
                                most_selling[ k ].units += parseFloat( v.unit_ordered );
                                most_selling[ k ].total_amount += parseFloat( v.unit_ordered * v.unit_selling_price );
                            }else{
                                most_selling[ k ] = {
                                    units: parseFloat( v.unit_ordered ),
                                    total_amount: parseFloat( v.unit_ordered * v.unit_selling_price ),
                                    id: k,
                                    item_desc: v.item_desc
                                }
                            }
                        }
                    });
                    
                }
                
                if( value.timestamp > week_timestamp ){
                    
                    var tsales = parseFloat( value.total_amount );
                    var gprofit = tsales - parseFloat( value.total_cost_price * 1 );
                    
                    if( week_data[value.day] && week_data[value.day].weekday ){
                        week_data[value.day].total_sales += tsales;
                        week_data[value.day].gross_profit += gprofit;
                    }else{
                        week_data[value.day] = {
                            weekday: value.week_day+', '+day+' '+months_of_year[ month ],
                            date: value.day,
                            total_sales: tsales,
                            gross_profit: gprofit,
                        };
                    }
                    
                }
                
            }
        });
	}
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
	
    var hidepiechart = true;
	if( total_value ){
        var maxs = new Array();
        var maxs_html = new Array();
        var ldataLimit = 6;
        for( var i = 0; i < ldataLimit; i++ )
            maxs[i] = 0;
        
        var dtset = new Array();
        $.each( most_selling, function( k , v ){
            var sort_field = v.units;
            for( var i = 0; i < ldataLimit; i++ ){
                if( sort_field > maxs[i] ){
                    var k = i + 1;
                    for( var j = k; j < ldataLimit; j++ ){
                        maxs[j] = maxs[j - 1];
                        maxs_html[ ldataLimit - j ] = maxs_html[ ldataLimit - j - 1];
                    }
                    maxs[i] = parseFloat( sort_field );
                    maxs_html[i] = [ v.item_desc + ' ( ' + appCurrencyText + v.total_amount+')' , v.units ];
                    break;
                }
            }
        });
        dtset = maxs_html;
        
		if( dtset.length > 0 ){
            hidepiechart = false;
            if( $('#dashboard-pie-chart') && $('#dashboard-pie-chart').hasClass('hidden') ){
                $('#dashboard-pie-chart')
                .removeClass('hidden');
            }
            
			var data = {
				id:'#chart1',
				dataset: dtset,
			};
            
			piechart( data );
		}
	}
	
    if( hidepiechart && $('#dashboard-pie-chart') && ( ! $('#dashboard-pie-chart').hasClass('hidden') ) ){
        $('#dashboard-pie-chart')
        .addClass('hidden');
    }
    
    var wLabel = new Array();
    var wSales = new Array();
    var wProfit = new Array();
    var j = 0;
    if( week_data ){
        $.each( week_data , function( k , v ){
            wLabel[j] = v.weekday;
            wSales[j] = v.total_sales;
            wProfit[j] = v.gross_profit;
            ++j;
            if( j > 7)return false;
        } );
        
        if( wLabel.length > 0 ){
            var data = {
                id: '#chart3',
                label: wLabel,
                sales: wSales,
                profit: wProfit,
            };
            barchart( data );
        }
    }
});

$( document ).on( "pagecreate", "#refunds", function() {
	test_for_active_user();
    activate_update_of_current_store( $("#refunds") );
    
    $('select#filter-return-refund-type')
    .on('change', function(){
        $('#refunds-container').html( '' );
        $('input#date-select-filter').change();
    });
    
    $('input#date-select-filter')
    .on('change', function(){
        var date = $(this).val();
        
        if( ! date )return false;
        
        var type = $('select#filter-return-refund-type').val();
        
        var daily_record = getData( type+date );
        
        if( daily_record ){
            var data = {};
            $.each( daily_record, function(k, v){
                data[k] = getData(k);
            });
            var html = get_refund_html( data );
            
            if( html ){
                var d = date.split('-');
                d[1] = (d[1]*1) - 1;
                $('#date-filter-field-label')
                .html( months_of_year[ d[1] ]+'-'+d[2]+'-'+d[0] );
                
                $('#refunds-container')
                .html( html )
                .trigger( "create")
                .find('.ui-collapsible')
                .tsort({attr:'timestamp', order:'desc'});
                
                activate_record_delete_button( "#refunds" );
            }else{
                //display no records msg
                var settings = {
                    message_title:'No Record was Found',
                    message_message: 'NOTE: You cannot view previous year\'s records \n\nYou need to generate reports to view',
                    auto_close: 'yes'
                };
                display_popup_notice( settings );
            }
        }
    });
    
    $('#popupRecords')
	.on( "popupafteropen", function( event, ui ) {
		if( $(this).data('key') ){
		
			var type = $(this).data('type');
			var key = $(this).data('key');
            
			var html = '';
			
            if( type ){
                switch( type ){
                case 'expenses':
                    //var sales_data = getData( key );
                break;
                }
            }else{
                var sales_data = getData( key );
                
                if( sales_data.inventory ){
                    $.each( sales_data.inventory , function( k , s ){
                       // var inventory = getData( k );
                        html += get_item_row_for_sales_records( s );
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
			}
            
		}else{
			//invalid sales id msg
		}
		
		$('#sales-record-pop-container')
		.html( html );
        
        $('#popupRecords')
        .popup( "reposition", { positionTo: 'window' } );
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

$( document ).on( "pagecreate", "#all-records", function() {
	test_for_active_user();
    activate_update_of_current_store( $("#all-records") );
    
    activate_panel_navigation( $("#all-records") );
    
    $('th.custom-button')
    .on('click', function(e){
        $('.subtotal-row')
        .not( '.'+$(this).attr('data-format')+'-subtotal-row' )
        .addClass('hidden');
        
        $('th.custom-button')
        .find('a')
        .removeClass('ui-icon-carat-u')
        .addClass('ui-icon-carat-d');
        
        if( $('.'+$(this).attr('data-format')+'-subtotal-row').hasClass('hidden') ){
            $('.'+$(this).attr('data-format')+'-subtotal-row').removeClass('hidden');
            $(this).find('a')
            .removeClass('ui-icon-carat-d')
            .addClass('ui-icon-carat-u');
        }else{
            $('.'+$(this).attr('data-format')+'-subtotal-row').addClass('hidden');
            $(this).find('a')
            .removeClass('ui-icon-carat-u')
            .addClass('ui-icon-carat-d');
        }
    });
});

function get_item_row_for_sales_records_summary( s ){
	return '<tr><td><b>'+s.label+'</b></td><td><b>'+s.value+'</b></td></tr>';
};

function get_item_row_for_sales_records( s ){
	var a = s.unit_ordered*s.unit_selling_price;
	
	var desc = '';
	var img_td = '';
	if( s &&  s.item_desc )desc = s.item_desc;
	else desc = 'product no longer exists';
	
    if( s.item_image ){
        var img = blubirdFileURL+s.item_image;
        if( blubirdWebbased ){
            img = 'imagebank/'+s.item_image;
        }
        img_td = '<td style="padding:0; text-align:center; vertical-align:middle;"><img src="'+img+'" height="60" /></td>';
    }
	return '<tr>'+img_td+'<td>'+desc+'<b>&nbsp;('+s.unit_ordered+')</b></td><td><b>'+formatNum(a.toFixed(2))+'</b></td></tr>';
};

function get_item_row_for_sales_records_striped( s ){
	var a = s.unit_ordered * s.unit_selling_price;
	
	var desc = '';
	if( s &&  s.item_desc )desc = s.item_desc;
	else desc = 'product no longer exists';
	
	return leftandRight( desc + ' ('+s.unit_ordered+'): ' , appCurrencyText + ' ' + formatNum( a.toFixed(2) ) );
};

function get_item_row_for_sales_records_stripedHTML( s ){
	var a = s.unit_ordered*s.unit_selling_price;
	
	var desc = '';
	if( s &&  s.item_desc )desc = s.item_desc;
	else desc = 'product no longer exists';
	
	return leftandRightHTML( desc+' ('+s.unit_ordered+')' , appCurrency +' '+formatNum( a.toFixed(2) ) );
};

$( document ).on( "pageshow", "#all-records", function() {
	populate_stores_select_box( $('#all-records').find('select.currently-active-store') );
    activate_menu();
    
	var sales = get_sales();
	var total_value = 0;
	var total_items = 0;
	var total_cost_price = 0;
	var total_vat = 0;
	
	var date = new Date();
	var tday = date.getDate();
    if( tday < 10 )tday = '0'+tday;
	var today = date.getFullYear() + '-' + months_of_year[ date.getMonth() ] + '-' + tday;
	var this_month = date.getFullYear() + '-' + months_of_year[ date.getMonth() ];
	var this_year = date.getFullYear();
	var this_week = date.getDay();
	
	var current_timestamp = date.getTime();
	var one_day = current_timestamp - (24*3600000);
	var two_day = current_timestamp - (48*3600000);
	var three_day = current_timestamp - (6*24*3600000);
		
	var today_html_days = '';
	var today_html_months = '';
	var today_html_years = '';
	
    var records = {
        'today':{},
        'last24hours':{},
        'last7days':{},
        'thismonth':{},
        'thisyear':{},
    };

	var one_day_html = '';
	var two_day_html = '';
	
    var ini_var = {sales:{}, expenses:{}, stock:{}, damages:{} };
    
	$('#sales-records-container')
	.find('a.sales-reccord')
	.on('click', function(e){
		e.preventDefault();
		
		$('#popupRecords')
		.data( 'key' , $(this).attr('key') )
		.popup('open', { positionTo: "window" });
	});
	
    var expenses = get_list_of_expenses();
    var damages = get_list_of_damages();
    var supply = get_list_of_supply();
    
	var one_day_total = 0;
	var two_day_total = 0;
	
	var today_total_days = 0;
	var today_total_months = 0;
	var today_total_years = 0;
	
    var data = {
        'sales':sales,
        'expenses':expenses,
        'damages':damages,
        'stock':supply,
    };
    
    if( currentStoreID ){
        $.each( data, function( k, v ){
            var daily = {};
            
            var one_day_total = 0;
            var two_day_total = 0;
            
            var today_total_days = 0;
            var today_total_months = 0;
            var today_total_years = 0;
            
            $.each( v , function( key , value ){
                
                switch( k ){
                case 'stock':
                    if( value && value.store_id )
                        value.store_name = value.store_id;
                break;
                }
                
                if( value && value.store_name == currentStoreID ){
                    
                    var date = new Date( value.timestamp );
                    // hours part from the timestamp
                    var day = date.getDate();
                    var month = date.getMonth();
                    var year = date.getFullYear();
                    var hours = date.getHours();
                    var minutes = date.getMinutes();
                    var seconds = date.getSeconds();
                    
                    if( day < 10 )day = '0'+day;
                    value.day_only = day;
                    value.week_day = weekdays[ date.getDay() ];
                    
                    value.month = month;
                    value.day = year + '-' + months_of_year[ month ] + '-' + day;
                    if( hours < 10 )hours = '0'+hours;
                    if( minutes < 10 )minutes = '0'+minutes;
                    value.hours = hours;
                    value.time = hours + ':' + minutes;
                    
                    switch( k ){
                    case 'expenses':
                        value.total_amount = value.amount;
                    break;
                    case 'damages':
                        value.total_amount = value.damage_qty;
                    break;
                    case 'stock':
                        value.total_amount = value.total_items;
                    break;
                    case 'sales':
                    break;
                    }
                    
                    if( value.day == today ){
                        if( ! records.today[ value.time ] )
                            records.today[ value.time ] = $.extend(true, {}, ini_var );
                        
                        if( ! records.today[ value.time ][k].key ){
                            records.today[ value.time ][k] = $.extend(true, {}, value );
                        }else{
                            records.today[ value.time ][k].key += ' '+value.key;
                            records.today[ value.time ][k].total_amount = parseFloat( records.today[ value.time ][k].total_amount ) + parseFloat( value.total_amount );
                        }
                            
                        today_total_days += parseFloat( value.total_amount );
                    }else{
                        if( value.timestamp > two_day ){
                            if( ! records.last24hours[ value.hours ] )
                                records.last24hours[ value.hours ] = $.extend(true, {}, ini_var );
                            
                            if( ! records.last24hours[ value.hours ][k].key ){
                                records.last24hours[ value.hours ][k] = $.extend(true, {}, value );
                            }else{
                                records.last24hours[ value.hours ][k].key += ' '+value.key;
                                records.last24hours[ value.hours ][k].total_amount = parseFloat( records.last24hours[ value.hours ][k].total_amount ) + parseFloat( value.total_amount );
                            }
                            
                            one_day_total += parseFloat( value.total_amount );
                        }
                    }
                    
                    if( value.timestamp < two_day && value.timestamp > three_day ){
                        if( ! records.last7days[ value.day ] )
                            records.last7days[ value.day ] = $.extend(true, {}, ini_var );
                            
                        if( ! records.last7days[ value.day ][k].key ){
                            records.last7days[ value.day ][k] = $.extend(true, {}, value );
                        }else{
                            records.last7days[ value.day ][k].key += ' '+value.key;
                            records.last7days[ value.day ][k].total_amount = parseFloat( records.last7days[ value.day ][k].total_amount ) + parseFloat( value.total_amount );
                        }
                        
                        two_day_total += parseFloat( value.total_amount );
                    }
                    
                    if( this_month == year + '-' + months_of_year[ month ] ){
                        if( ! records.thismonth[ value.day ] )
                            records.thismonth[ value.day ] = $.extend(true, {}, ini_var );
                        
                        if( ! records.thismonth[ value.day ][k].key ){
                            records.thismonth[ value.day ][k] =  $.extend(true, {}, value );
                        }else{
                            records.thismonth[ value.day ][k].key += ' '+value.key;
                            records.thismonth[ value.day ][k].total_amount = parseFloat( records.thismonth[ value.day ][k].total_amount ) + parseFloat( value.total_amount );
                        }
                        
                        today_total_months += parseFloat( value.total_amount );
                    }
                    
                    if( this_year == year ){
                        if( ! records.thisyear[ months_of_year[ month ] ] )
                            records.thisyear[ months_of_year[ month ] ] = $.extend(true, {}, ini_var );
                        
                        if( ! records.thisyear[ months_of_year[ month ] ][k].key ){
                            records.thisyear[ months_of_year[ month ] ][k] =  $.extend(true, {}, value );
                        }else{
                            records.thisyear[ months_of_year[ month ] ][k].key += ' '+value.key;
                            records.thisyear[ months_of_year[ month ] ][k].total_amount = parseFloat( records.thisyear[ months_of_year[ month ] ][k].total_amount ) + parseFloat( value.total_amount );
                        }
                        today_total_years += parseFloat( value.total_amount );
                    }
                    
                    switch( k ){
                    case 'expenses':
                    case 'damages':
                    case 'stock':
                    case 'sales':
                        var m2 = month + 1;
                        if(  m2 < 10 )var m1 = '0'+m2;
                        else var m1 = m2;
                        
                        if( ! daily[ k + year + '-' + m1 + '-' + day ] )daily[ k + year + '-' + m1 + '-' + day ] = {};
                        daily[ k + year + '-' + m1 + '-' + day ][ value.key ] = value.key;
                    break;
                    }
               }
            });
            
            var currency = '';
            var suffix = '';
            if(! today_total_days)today_total_days = 0;
            if(! today_total_months)today_total_months = 0;
            if(! today_total_years)today_total_years = 0;
            if(! two_day_total)two_day_total = 0;
            if(! one_day_total)one_day_total = 0;
            
            switch( k ){
            case 'stock':
            case 'sales':
            case 'expenses':
            case 'damages':
                $.each( daily, function( k1 , v1 ){
                    putData( k1, v1 );
                });
            break;
            }
            
            switch( k ){
            case 'expenses':
            case 'sales':
                currency = appCurrency;
                today_total_days = today_total_days.toFixed(2);
                today_total_months = today_total_months.toFixed(2);
                today_total_years = today_total_years.toFixed(2);
                two_day_total = two_day_total.toFixed(2);
                one_day_total = one_day_total.toFixed(2);
            break;
            case 'stock':
            case 'damages':
                suffix = ' unit(s)';
            break;
            }
            
            $('#today-records-'+k+'-total')
            .html( currency + formatNum( today_total_days ) + suffix );
            
            $('#thismonth-records-'+k+'-total')
            .html( currency + formatNum( today_total_months ) + suffix );
            
            $('#thisyear-records-'+k+'-total')
            .html( currency + formatNum( today_total_years ) + suffix );
            
            $('#last7days-records-'+k+'-total')
            .html( currency + formatNum( two_day_total ) + suffix );
            
            $('#last24hours-records-'+k+'-total')
            .html( currency + formatNum( one_day_total ) + suffix );
        });
    }
	
    $('#all-records-summary-table')
    .find('tr.subtotal-row')
    .remove();
    
    $.each( records, function(key,v1){
        var html = '';
        $.each(v1, function( time , v2 ){
            v2.format = key;
            html += get_sales_records_html_new( v2 );
        });
        if( html ){
            $('#'+key+'-records')
            .after(html);
        }
    });
    
    $('#all-records-summary-table')
    .table('refresh');
});

$( document ).on( "pageshow", "#refunds", function() {
	populate_stores_select_box( $('#refunds').find('select.currently-active-store') );
    
    var date = new Date();
    
    // hours part from the timestamp
    var day = date.getDate();
    var month = date.getMonth();
    var year = date.getFullYear();
    
    if( day < 10 )day = '0'+day;
    ++month;
    if( month < 10 )month = '0'+month;
    
    $('input#date-select-filter')
    .val(year + '-' + month + '-' + day)
    .change();
});

function get_refund_html( data ){
    var html = '';
    var total = 0;
    console.log( 'dd', data);
    var cost_str = appCurrency;
    
    if( currentStoreID ){
        $.each( data , function( key , value ){
            if( ! value )return;
            
            switch(value.object){
            case 'supply':
                value.store_name = value.store_id;
                value.total_items = parseFloat( value.total_items );
            break;
            case 'expenses':
                value.total_amount = parseFloat( value.amount );
            break;
            case 'damages':
                value.total_items = parseFloat( value.damage_qty );
                value.total_amount = value.total_items;
                cost_str = '';
            break;
            }
            
            if( value && value.store_name == currentStoreID ){
                var date = new Date( value.timestamp );
                // hours part from the timestamp
                var day = date.getDate();
                var month = date.getMonth();
                var year = date.getFullYear();
                var hours = date.getHours();
                var minutes = date.getMinutes();
                var seconds = date.getSeconds();
                
                if( day < 10 )day = '0'+day;
                value.day_only = day;
                value.week_day = weekdays[ date.getDay() ];
                
                value.month = month;
                value.day = year + '-' + months_of_year[ month ] + '-' + day;
                if( hours < 10 )hours = '0'+hours;
                if( minutes < 10 )minutes = '0'+minutes;
                value.hours = hours;
                value.time = hours + ':' + minutes;
                
                total += parseFloat( value.total_amount );
                html += get_sales_records_html( value );
            }
        });
    }
    
    $('#total-value-filter-field-label')
    .html( cost_str + formatNum( total.toFixed(2) ) );
    return html;
};

function get_expenses_records_html( data , format ){
	var date = '';
	if( format ){
		date = data.week_day+', '+data.day_only+' '+months_of_year[ data.month ]+' ';
	}
    var a = 0;
	if( data.amount ){
		a = parseFloat( data.amount );
	}
	return '<li><h4>'+data.description+'</h4><p class="date">'+date+data.time+'</p><p class="amount">'+appCurrency+' '+ formatNum( a.toFixed(2) ) +'</p></li>';
};

function get_sales_records_html( data ){
	var date = '', html = '', html1 = '', format = '';
	if( format ){
		date = data.week_day+', '+data.day_only+' '+months_of_year[ data.month ]+' ';
	}
	if( ! parseFloat( data.total_amount ) ){
		data.total_amount = 0;
	}
    if( ! parseFloat( data.total_items ) ){
		data.total_items = 0;
	}
    if( data.inventory ){
        $.each( data.inventory , function( k , s ){
            //var inventory = getData( k );
            html += get_item_row_for_sales_records( s );
        });
    }
    if( data.stock ){
        $.each( data.stock , function( k , s ){
            var stock = getData( k );
            if( stock ){
                var item = getData( stock.item_barcode );
                stock.item_desc = 'N/A';
                if( item && item.item_desc )
                    stock.item_desc = item.item_desc;
                stock.format = 1;
                //if( item.item_image )stock.item_image = item.item_image;
                
                html += get_last_supply_activity_html( stock );
            }
        });
    }
    
    var cost_str = ' Cost'+': '+appCurrency;
    if( data.object ){
    switch(data.object){
    case 'sales':
        html1 += '<tr><td>Sub-total</td><td>'+formatNum(data.subtotal.toFixed(2))+'</td></tr>';
        html1 += '<tr><td>VAT</td><td>'+formatNum(data.vat.toFixed(2))+'</td></tr>';
        html1 += '<tr><td>Discount</td><td>'+formatNum(data.discount.toFixed(2))+'</td></tr>';
        
        html1 += '<tr><td><strong>Total Amount Due</strong></td><td><strong>'+formatNum(data.total_amount.toFixed(2))+'</strong></td></tr>';
        
        var change = data.total_amount_tendered - data.total_amount;
        html1 += '<tr><td>Amount Paid</td><td>'+formatNum(data.total_amount_tendered.toFixed(2))+'</td></tr>';
        html1 += '<tr><td>Change</td><td>'+formatNum(change.toFixed(2))+'</td></tr>';
    break;
    case 'supply':
        html1 += '<tr><td><strong>Total Items Supplied</strong></td><td><strong>'+formatNum(data.total_items.toFixed(2))+'</strong></td></tr>';
        html1 += '<tr><td><strong>Total Amount Due</strong></td><td><strong>'+formatNum(data.total_amount.toFixed(2))+'</strong></td></tr>';
        
        var change = data.total_amount - data.total_amount_paid;
        html1 += '<tr><td>Amount Paid</td><td>'+formatNum(data.total_amount_paid.toFixed(2))+'</td></tr>';
        html1 += '<tr><td>Outstanding Balance Owed</td><td>'+formatNum(change.toFixed(2))+'</td></tr>';
    break;
    case 'expenses':
        html1 += '<tr><td>Date Incured</td><td><strong>'+data.date+'</strong></td></tr>';
        html1 += '<tr><td>Type of Expense</td><td><strong>'+data.type+'</strong></td></tr>';
        
        html += '<tr><td>'+data.description+'</td></tr>';
    break;
    case 'damages':
        cost_str = ' Units Damaged: ';
        data.total_amount = data.total_items;
        
        html1 += '<tr><td>Description of Damage</td><td><strong>'+data.damage_desc+'</strong></td></tr>';
        html1 += '<tr><td>Date Incured</td><td><strong>'+data.date+'</strong></td></tr>';
        
        var i = getData( data.item_barcode );
        if( i && i.item_desc )
            html += '<tr><td>'+i.item_desc+'</td><td>'+data.total_items+'</td></tr>';
    break;
    }
    }
    
	return '<div data-role="collapsible" id="container-'+data.key+'" timestamp="'+data.timestamp+'"><h5><p style="float:right;"><strong>'+date+data.time+'</strong></p>Total'+cost_str+ formatNum( data.total_amount.toFixed(2) ) +'<p>#'+data.key+'</p></h5><p><div class="ui-grid-a invt" ><div class="ui-block-a" style="padding: 0 0.35em 0 0;"><table class="custom-more-details">'+html1+'</table><button class="delete-record" object="'+data.object+'" key="'+data.key+'" href="#" data-role="button" data-mini="true" data-theme="a" data-border="none" data-icon="delete" style="margin-top:2px;"><b>Delete</b></button></div> <div class="ui-block-b" style="padding: 0 0 0 0.35em;"><table class="custom-more-details">'+html+'</table></div></div></p></div>';
};

function get_sales_records_html_new( data ){
	var date = '';
    var sales = {total:'-', key:''};
    var expenses = {total:'-', key:''};
    var damages = {total:'-', key:''};
    var stock = {total:'-', key:''};
    var time, weekday, day, month, full_month, hours = '';
    if( data.sales && data.sales.key ){
        sales.total = formatNum( parseFloat( data.sales.total_amount ).toFixed(2) );
        sales.key = data.sales.key;
        if( data.sales.time ){
            hours = data.sales.hours;
            time = data.sales.time;
            day = ' '+data.sales.day_only;
            weekday = data.sales.week_day+', ';
            month = months_of_year[ data.sales.month ];
            full_month = full_months_of_year[ data.sales.month ];
        }
    }
    if( data.expenses && data.expenses.key ){
        expenses.total = formatNum( parseFloat( data.expenses.total_amount ).toFixed(2) );
        expenses.key = data.expenses.key;
        
        if( data.expenses.time ){
            hours = data.expenses.hours;
            time = data.expenses.time;
            day = ' '+data.expenses.day_only;
            weekday = data.expenses.week_day+', ';
            month = months_of_year[ data.expenses.month ];
            full_month = full_months_of_year[ data.expenses.month ];
        }
    }
    if( data.damages && data.damages.key ){
        damages.total = formatNum( parseFloat( data.damages.total_amount ) );
        damages.key = data.damages.key;
        
        if( data.damages.time ){
            hours = data.damages.hours;
            time = data.damages.time;
            day = ' '+data.damages.day_only;
            weekday = data.damages.week_day+', ';
            month = months_of_year[ data.damages.month ];
            full_month = full_months_of_year[ data.damages.month ];
        }
    }
    if( data.stock && data.stock.key ){
        stock.total = formatNum( parseFloat( data.stock.total_amount ) );
        stock.key = data.stock.key;
        
        if( data.stock.time ){
            hours = data.stock.hours;
            time = data.stock.time;
            day = ' '+data.stock.day_only;
            weekday = data.stock.week_day+', ';
            month = months_of_year[ data.stock.month ];
            full_month = full_months_of_year[ data.stock.month ];
        }
    }
    
	switch( data.format ){
    case 'today':
        day = '';
        weekday = '';
        month = '';
    break;
    case 'last24hours':
        time = ' - '+hours+':00';
    break;
    case 'thisyear':
        time = '';
        day = '';
        weekday = '';
        month = full_month;
    break;
    default:
        time = '';
    break;
	}
	date = weekday+month+day;
    
	return '<tr class="'+data.format+'-subtotal-row subtotal-row hidden"><th>'+date+time+'</th><td key="'+sales.key+'">'+ sales.total +'</td><td key="'+expenses.key+'">'+expenses.total+'</td><td>'+stock.total+'</td><td>'+ damages.total +'</td></tr>';
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

function update_customers_list_on_customers_page(){
	var customers = get_list_of_customers();
	var html = '';
	var html2 = '<option value="new">Add New Customer</option>';
	
	$.each( customers , function( key , value ){
		//html += get_supplier_html( key , value );
		html2 += '<option value="'+key+'">'+value.customer_name+' ('+value.customer_mobile+')</option>';
	});
	
	$('select[name="customers"]')
	.html( html2 );
	
	$('select[name="customers"]')
	.find('option')
	.tsort();
};

function update_customers_debt_list_on_customers_page( payment ){
	var html = '';
	if( payment && payment.amount_paid ){
		html = get_customer_recent_debt_payments_html( payment );
        
        var amount_owed = -1 * payment.amount_paid;
        if( $('.customer-amount-owed') && $('.customer-amount-owed').attr( 'value' ) ){
            amount_owed += parseFloat( $('.customer-amount-owed').attr( 'value' ) );
        }
        
        var debt_paid = parseFloat( payment.amount_paid );
        if( $('#customer-debt-paid') && $('#customer-debt-paid').attr( 'value' ) ){
            debt_paid += parseFloat( $('#customer-debt-paid').attr( 'value' ) );
        }
        
        if( debt_paid ){
            $('#customer-debt-paid')
            .attr( 'value', debt_paid )
            .html( appCurrency +' '+ formatNum( debt_paid.toFixed(2) ) );
        }
        
        $('.customer-amount-owed')
        .attr( 'value', amount_owed )
        .html( appCurrency +' '+ formatNum( amount_owed.toFixed(2) ) );
	}
	
    if( html ){
        $('#customer-recent-payment-history-container')
        .prepend( html );
	}
};

function update_suppliers_debt_list_on_suppliers_page( payment ){
	var html = '';
	if( payment && payment.amount_paid ){
		html = get_supplier_recent_debt_payments_html( payment );
        
        var amount_owed = -1 * payment.amount_paid;
        if( $('.supplier-amount-owed') && $('.supplier-amount-owed').attr( 'value' ) ){
            amount_owed += parseFloat( $('.supplier-amount-owed').attr( 'value' ) );
        }
        
        var debt_paid = parseFloat( payment.amount_paid );
        var total_amount_paid = debt_paid;
        if( $('#supplier-debt-paid') && $('#supplier-debt-paid').attr( 'value' ) ){
            debt_paid += parseFloat( $('#supplier-debt-paid').attr( 'value' ) );
        }
        
        if( $('#supplier-total-amount-paid') && $('#supplier-total-amount-paid').attr( 'value' ) ){
            total_amount_paid += parseFloat( $('#supplier-total-amount-paid').attr( 'value' ) );
        }
        
        if( debt_paid ){
            $('#supplier-debt-paid')
            .attr( 'value', debt_paid )
            .html( appCurrency +' '+ formatNum( debt_paid.toFixed(2) ) );
        }
        
        $('.supplier-amount-owed')
        .attr( 'value', amount_owed )
        .html( appCurrency +' '+ formatNum( amount_owed.toFixed(2) ) );
        
        $('#supplier-total-amount-paid')
        .attr( 'value' , total_amount_paid )
        .html( appCurrency +' '+ formatNum( total_amount_paid.toFixed(2) ) );
	}
	
    if( html ){
        $('#supplier-recent-payment-history-container')
        .prepend( html );
	}
};

function update_expenses_list_on_expenses_page(){
	var expenses = get_list_of_expenses();
	var html = '';
	
    var maxs = new Array();
    var maxs_html = new Array();
    var maxs_html_count = 0;
    for( var i = 0; i < dataLimit; i++ )
        maxs[i] = 0;
    
    if( currentStoreID ){
        $.each( expenses , function( key , value ){
            if( value.store_name && currentStoreID == value.store_name ){
                if( value.timestamp ){
                    var sort_field = value.timestamp;
                    for( var i = 0; i < dataLimit; i++ ){
                        if( sort_field > maxs[i] ){
                            var k = i + 1;
                            for( var j = k; j < dataLimit; j++ ){
                                maxs[j] = maxs[j - 1];
                                maxs_html[ dataLimit - j ] = maxs_html[ dataLimit - j - 1];
                            }
                            
                            maxs[i] = parseFloat( sort_field ) - 1;
                            
                            maxs_html[i] = get_expenses_html( key , value );
                            
                            break;
                        }
                    }
                }
                html = maxs_html.join(" ");
            }
        });
	}
    
	$( '#expenses-list-container' )
	.html( html )
	.find('tr')
	.tsort({attr:'timestamp', order:'desc'});
	
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

function update_users_list_on_users_page( page ){
	var category = get_list_of_users();
	var html = '';
	var html2 = '<option value="new"> - New User - </option>';
	var html3 = '<option value=""> - Select User- </option>';
	
	$.each( category , function( key , value ){
        if( key != customUUID ){
            html2 += '<option value="'+key+'">'+value.name+' ('+value.email+')</option>';
        }
        html3 += '<option value="'+key+'">'+value.name+' ('+value.email+')</option>';
        html += get_users_html( key , value );
	});
	
    switch( page ){
    case '#mngusers':
        $( page )
        .find( '#users-list-container' )
        .html( html )
        .find('tr')
        .tsort({attr:'timestamp', order:'desc'});
        
        $('#users-select-box')
        .html( html2 )
        .selectmenu("refresh")
        .find('option')
        .tsort();
    break;
    case '#switch-user':
        $('#switch-user-id-field')
        .html( html3 )
        .selectmenu("refresh")
        .find('option')
        .tsort();
    break;
    }
};

function update_stores_list_on_stores_page(){
	var category = get_list_of_stores();
	var html = '';
	var html2 = '<option value="new"> - New Store - </option>';
	
	var user = {};
	$.each( category , function( key , value ){
		if( value ){
			if( value.user ){
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
            
            html += get_stores_html( key , value );
            html2 += '<option value="'+key+'">'+value.name+'</option>';
		}
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
	var html2 = '<option value="new">-- Select Item --</option>';
    
    var max1 = 0;
    var max2 = 0;
    var max3 = 0;
    
	$.each( inventory , function( key , value ){
		if( value ){
            //Last Five
            if( value.timestamp && ( value.timestamp > max1 || value.timestamp > max2 || value.timestamp > max3 )  ){
                max3 = max2;
                max2 = max1;
                max1 = value.timestamp;
                html += get_new_inventory_html( key , value );
            }
			html2 += '<option value="'+key+'" class="'+value.category+'">'+value.item_desc+' ['+value.item_barcode+']</option>';
		}
	});
	
	if( html2 ){
		$('#item-select-field')
		.html( html2 )
		.find('option')
		.tsort();
        
        $allItemSelectBox = $('#item-select-field').clone();
	}
    
	if( html ){
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
			$.mobile.navigate( "#my-profile", { transition : "none" });
		}else{
			//bind events handlers
			handle_form_submission( $('form#sign-up-form') );
		}
		//check if app should be locked
        check_for_locked_application();
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "swiperight", function(e){
    $.mobile.navigate( "#switch-user", { transition : "none" });
});

$( document ).on( "pageshow", "#signup", function() {
    $("#signup").find('input[name="push_notification_id"]').val( pushNotificationID );
});

$( document ).on( "pageshow", "#login", function() {
    $("#login").find('input[name="push_notification_id"]').val( pushNotificationID );
});

$( document ).on( "pagecreate", "#reports-page", function() {
	test_for_active_user();
    activate_update_of_current_store( $("#reports-page") );
    handle_form_submission( $('form#generate-report-form') );
});

$( document ).on( "pageshow", "#reports-page", function() {
	populate_stores_select_box( $('#reports-page').find('select.currently-active-store') );
    
    var reports = getData( 'reports' );
    var report_types_option = '<option value=""> - Report Type - </option>';
    var report_formats_option = '<option value=""> - Report Format - </option>';
    
    if( reports && Object.getOwnPropertyNames(reports).length ){
        if( reports.report_types ){
            $.each( reports.report_types, function( k , v ){
                if( k && v ){
                    report_types_option += '<option value="'+k+'">'+v+'</option>';
                }
            });
            
            if( report_types_option ){
                $('#reports-page')
                .find('form#generate-report-form')
                .find('select[name="type"]' )
                .html( report_types_option )
                .selectmenu("refresh");
            }
        }
        
        if( reports.report_formats ){
            $.each( reports.report_formats, function( k , v ){
                if( k && v ){
                    report_formats_option += '<option value="'+k+'">'+v+'</option>';
                }
            });
            
            if( report_formats_option ){
                $('#reports-page')
                .find('form#generate-report-form')
                .find('select[name="format"]' )
                .html( report_formats_option )
                .selectmenu("refresh");
            }
        }
    }
});

$( document ).on( "pagecreate", "#login", function() {
	if( customUUID ){
		//bind events handlers
		handle_form_submission( $('form#login-form') );
        
        //check if app should be locked
        check_for_locked_application();
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pagecreate", "#switch-user", function() {
	if( customUUID ){
		//bind events handlers
		$('form#switch-user-form')
        .on('submit', function(e){
            e.preventDefault();
            
            var user_id = $('#switch-user-id-field').val();
            if( user_id ){
                var user_details = getData( user_id );
                if( user_details && user_details.role && user_details.password ){
                    if( user_details.password != md5( $('#switch-user-password-field').val()+appSalter ) && user_details.password != $('#switch-user-password-field').val() ){
                        var settings = {
                            message_title:'Invalid Password',
                            message_message: 'Please provide a valid password',
                            auto_close: 'yes'
                        };
                        display_popup_notice( settings );
                        return false;
                    }
                    
                    $('body')
                    .removeClass( $('body').attr('data-user-role') )
                    .addClass( user_details.role )
                    .attr( 'data-user-role', user_details.role );
                    
                    putData( appSwitchUserkey , user_details );
                    $.mobile.navigate( "#dashboard", { transition : "none" });
                    $('#switch-user-password-field').val('');
                    return false;
                }
            }
            var settings = {
                message_title:'Invalid Details',
                message_message: 'Please select a valid account & provide a valid password ',
                auto_close: 'yes'
            };
            display_popup_notice( settings );
            return false;
        });
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pageshow", "#switch-user", function() {
	update_users_list_on_users_page( "#switch-user" );
});

$( document ).on( "pageshow", "#supplier", function() {
    activate_menu();
    check_for_data_to_upload( $('#supplier') );
});

$( document ).on( "pagecreate", "#supplier", function() {
	test_for_active_user();
    //registered
    handle_form_submission( $('form#suppliers-form') );
    handle_form_submission( $('#supplier').find('form#supplierpayments-form') );
    
    activate_panel_navigation( $("#supplier") );
    //Display List of Suppliers
    update_suppliers_list_on_suppliers_page();
    
    activate_manual_upload_data_button_click_event( $("#supplier") );
    
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
            
            $( '#supplierpayments-form' )
            .find('#supplier-field')
            .val( val );
            
            $('#suppliers-form #mobile-field').blur();
            $( '#suppliers-form #email-field' ).blur();
            
            var total_amount_paid = 0;
            var total_amount = 0;
            var total_amount_owed = 0;
            var total_debt_paid = 0;
            var supply = {};
            //recent supply activity
            var html = '';
            if( supplier.stock ){
                $.each( supplier.stock , function( k , v ){
                    var stock = getData( k );
                    if( stock ){
                        var item = getData( stock.item_barcode );
                        stock.item_desc = item.item_desc;
                        
                        if( item.item_image )stock.item_image = item.item_image;
                        
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
            
            var maxs = new Array();
            var maxs_html = new Array();
            var maxs_html_count = 0;
            for( var i = 0; i < dataLimit; i++ )
                maxs[i] = 0;
            
            var payment_html = '';
            if( supplier.payments ){
                
                $.each( supplier.payments , function( k , v ){
                    var payment = getData( k );
                    if( payment && payment.timestamp ){
                        for( var i = 0; i < dataLimit; i++ ){
                            if( payment.timestamp > maxs[i] ){
                                var k = i + 1;
                                for( var j = k; j < dataLimit; j++ ){
                                    maxs[j] = maxs[j - 1];
                                    maxs_html[ dataLimit - j ] = maxs_html[ dataLimit - j - 1];
                                }
                                maxs[i] = parseFloat( payment.timestamp ) - 1;
                                maxs_html[i] = get_supplier_recent_debt_payments_html( payment );
                                break;
                            }
                        }
                        
                        total_debt_paid += parseFloat( payment.amount_paid );
                    }
                });
                
                payment_html = maxs_html.join(" ");
            }
            
            if( total_amount )
                total_amount_owed = total_amount - ( total_amount_paid + total_debt_paid );
            
            $( '#supplierpayments-form' )
            .find('#amount_paid-field')
            .attr( 'max' , total_amount_owed );
            
            $('.supplier-amount-owed')
            .attr( 'value' , total_amount_owed )
            .html( appCurrency +' '+ formatNum( total_amount_owed.toFixed(2) ) );
            
            $('#supplier-debt-paid')
            .attr( 'value' , total_debt_paid )
            .html( appCurrency +' '+ formatNum( total_debt_paid.toFixed(2) ) );
            
            var tap = ( total_amount_paid + total_debt_paid );
            $('#supplier-total-amount-paid')
            .attr( 'value' , tap )
            .html( appCurrency +' '+ formatNum( tap.toFixed(2) ) );
            
            $('#supplier-recent-payment-history-name')
            .html( supplier.supplier_name );
            
            $('#supplier-recent-payment-history-container')
            .html( payment_html )
            .find('tr')
            .tsort({attr:'timestamp', order:'desc'});
            
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
            
            $( '#supplierpayments-form' )
            .find('input')
            .val( '' );
        }
    });
    
    $( '#supplierpayments-form' )
    .find('#amount_paid-field')
    .on('blur', function(){
        var max = parseFloat( $(this).attr('max') );
        if( $(this).val() && $(this).val() > max ){
            $(this).val( max );
            
            var settings = {
                message_title:'Invalid Amount',
                message_message: 'Suppliers cannot be repaid debts greater than what they are owed',
                auto_close: 'yes'
            };
            display_popup_notice( settings );
        }
    });
    
    $('#suppliers-form #mobile-field')
    .add( '#suppliers-form #email-field' )
    .on('blur', function(){
        $('#'+$(this).attr('id')+'-link')
        .attr('href', $(this).attr('protocol')+$(this).val() );
    });
});

$( document ).on( "pageshow", "#expenses", function() {
    activate_menu();
    check_for_data_to_upload( $('#expenses') );
    
    populate_stores_select_box( $('#expenses-form').find('select.currently-active-store') );
});

$( document ).on( "pagecreate", "#expenses", function() {
	test_for_active_user();
    //registered
    handle_form_submission( $('form#expenses-form') );
    
    activate_panel_navigation( $("#expenses") );
    //Display List of Suppliers
    update_expenses_list_on_expenses_page();
    
    activate_manual_upload_data_button_click_event( $("#expenses") );
    
    $('#expenses-form')
    .find('select#store_name-field')
    .on('change', function(){
        if( $(this).val() ){
            currentStoreID = $(this).val();
            update_expenses_list_on_expenses_page();
        }
    });
});

$( document ).on( "pageshow", "#customers", function() {
    activate_menu();
    check_for_data_to_upload( $('#customers') );
});

$( document ).on( "pagecreate", "#customers", function() {
	test_for_active_user();
    //registered
    handle_form_submission( $('form#customers-form') );
    handle_form_submission( $('#customers').find('form#payments-form') );
    
    activate_panel_navigation( $("#customers") );
    //Display List of Suppliers
    update_customers_list_on_customers_page();
    
    activate_manual_upload_data_button_click_event( $("#customers") );
    
    $('#customers-select-box')
    .on('change', function(){
        var val = $(this).val();
        if( val && val != 'new' ){
            var customer = getData( val );
            
            $.each( customer, function(key , value ){
                $('form#customers-form')
                .find('#'+key+'-field')
                .val( value );
            });
            
            $( '#payments-form' )
            .find('#customer-field')
            .val( val );
            
            $( '#customers-form #customer_mobile-field' ).blur();
            $( '#customers-form #customer_email-field' ).blur();
            
            var total_debt_paid = 0;
            var total_amount_paid = 0;
            var total_amount = 0;
            var total_amount_owed = 0;
            var supply = {};
            
            var maxs = new Array();
            var maxs_html = new Array();
            var maxs_html_count = 0;
            for( var i = 0; i < dataLimit; i++ )
                maxs[i] = 0;
            
            //recent purchases
            var html = '';
            if( customer.sale ){
                $.each( customer.sale , function( k , v ){
                    var sale = getData( k );
                    if( sale && sale.timestamp ){
                        //Last Five
                        for( var i = 0; i < dataLimit; i++ ){
                            if( sale.timestamp > maxs[i] ){
                                var k = i + 1;
                                for( var j = k; j < dataLimit; j++ ){
                                    maxs[j] = maxs[j - 1];
                                    maxs_html[ dataLimit - j ] = maxs_html[ dataLimit - j - 1];
                                }
                                maxs[i] = parseFloat( sale.timestamp ) - 1;
                                maxs_html[i] = get_customer_recent_purchases_html( sale );
                                break;
                            }
                        }
                        
                        total_amount_paid += parseFloat( sale.total_amount_tendered );
                        total_amount += parseFloat( sale.total_amount );
                    }
                });
                html = maxs_html.join(" ");
            }
            
            var maxs = new Array();
            var maxs_html = new Array();
            var maxs_html_count = 0;
            for( var i = 0; i < dataLimit; i++ )
                maxs[i] = 0;
            
            var payment_html = '';
            if( customer.payments ){
                $.each( customer.payments , function( k , v ){
                    var payment = getData( k );
                    if( payment && payment.timestamp ){
                        for( var i = 0; i < dataLimit; i++ ){
                            if( payment.timestamp > maxs[i] ){
                                var k = i + 1;
                                for( var j = k; j < dataLimit; j++ ){
                                    maxs[j] = maxs[j - 1];
                                    maxs_html[ dataLimit - j ] = maxs_html[ dataLimit - j - 1];
                                }
                                maxs[i] = parseFloat( payment.timestamp ) - 1;
                                maxs_html[i] = get_customer_recent_debt_payments_html( payment );
                                break;
                            }
                        }
                        
                        total_debt_paid += parseFloat( payment.amount_paid );
                    }
                });
                
                payment_html = maxs_html.join(" ");
            }
            
            if( total_amount )
                total_amount_owed = total_amount - total_amount_paid;
            
            total_amount_owed = total_amount_owed - total_debt_paid;
            
            $( '#payments-form' )
            .find('#amount_paid-field')
            .attr( 'max' , total_amount_owed );
            
            $('.customer-amount-owed')
            .attr( 'value' , total_amount_owed )
            .html( appCurrency +' '+ formatNum( total_amount_owed.toFixed(2) ) );
            
            $('#customer-debt-paid')
            .attr( 'value' , total_debt_paid )
            .html( appCurrency +' '+ formatNum( total_debt_paid.toFixed(2) ) );
            
            $('#customer-recent-payment-history-name')
            .html( customer.customer_name );
            
            $('#customer-recent-payment-history-container')
            .html( payment_html )
            .find('tr')
            .tsort({attr:'timestamp', order:'desc'});
            
            $('#customer-recent-purchase-history-container')
            .html( html )
            .find('tr')
            .tsort({attr:'timestamp', order:'desc'});
            
        }else{
            $('form#customers-form')
            .find('input')
            .val('');
            
            $( '#payments-form' )
            .find('input')
            .val( '' );
        }
    });
    
    $( '#payments-form' )
    .find('#amount_paid-field')
    .on('blur', function(){
        var max = parseFloat( $(this).attr('max') );
        if( $(this).val() && $(this).val() > max ){
            $(this).val( max );
            
            var settings = {
                message_title:'Invalid Amount',
                message_message: 'Customers cannot repay debts greater than what they owe',
                auto_close: 'yes'
            };
            display_popup_notice( settings );
        }
    });
    
    $('#customers-form #customer_mobile-field')
    .add( '#customers-form #customer_email-field' )
    .on('blur', function(){
        $('#'+$(this).attr('id')+'-link')
        .attr('href', $(this).attr('protocol')+$(this).val() );
    });
});

$( document ).on( "pagecreate", "#restore-points", function() {
	test_for_active_user();
	
	$('#create-restore-points')
	.on('click', function(){
        create_restore_points(1);
    });
    
	$('#clear-all-restore-points')
	.on('click', function(){
        appDB.restore_points.clear();
        $('tbody#restore-points-list-container')
        .html('');
        
        var settings = {
            'message_title':'All Restore Points have been deleted!',
            'message_message':'',
        };
        display_popup_notice( settings );
    });
});

$( document ).on( "pageshow", "#restore-points", function() {
    display_restore_points();
});

function create_restore_points( type ){
    appDB.restore_points
    .where('id').equals(2).each(function( res ){
       appDB.restore_points
        .put({
            id: 3,
            data: res.data,
            timestamp: res.timestamp,
            size: res.size
        }); 
    });
    
    appDB.restore_points
    .where('id').equals(1).each(function( res ){
       appDB.restore_points
        .put({
            id: 2,
            data: res.data,
            timestamp: res.timestamp,
            size: res.size
        }); 
    });
    
    var d = new Date();
    var sA = amplify.store();
    var b = $.param( sA );
    appDB.restore_points
    .put({
        id: 1,
        data: sA,
        timestamp: d.getTime(),
        size: b.length,
    }).then(function(){
        return appDB.restore_points.get(1);
    }).then(function( res ){
        if( type ){
            setTimeout( display_restore_points, 300 );
            var settings = {
                'message_title':'Restore Point Created!',
                'message_message':'',
            };
            display_popup_notice( settings );
        }
    });
};
function display_restore_points(){
    
    appDB.restore_points
    .orderBy("timestamp")
    .reverse()
    .toArray( function(res){
        var html = '';
        for(i=0; i<res.length; i++ ){
            
        var date = new Date( res[i].timestamp );
        // hours part from the timestamp
        var calendar_day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var day = year+'-'+months_of_year[ month ]+'-'+calendar_day;
        var minutes = date.getMinutes();
        
        if( minutes < 10 )minutes = '0'+minutes;
        var time = date.getHours() + ':' + minutes;
        
        html += '<tr id="'+res[i].id+'" timestamp="'+res[i].timestamp+'"><td>'+formatNum( ( res[i].size / (1024 ) ).toFixed(2) )+' KB</td><td>'+day+', '+time+'</td><td class="ui-table-priority-1"><a href="#" class="ui-btn ui-btn-inline ui-icon-refresh ui-btn-icon-notext ui-theme-a ui-corner-all restore-dataset-button">Restore</a></td></tr>';
        }
        $('tbody#restore-points-list-container')
        .html(html);
        
        if( html ){
            $('a.restore-dataset-button')
            .on('click', function(){
                var id = parseFloat( $(this).parents('tr').attr('id') );
                
                appDB.restore_points
                .where('id')
                .equals(id)
                .each(function(res){
                    var r = confirm('Do you want to restore to the selected dataset?\n\nNOTE: Restoration will wipeout your current dataset');
                    if( r == true ){
                        //perform backup
                        //create_restore_points(1);
                        
                        clearData();
                        $.each( res.data, function(k,v){
                            switch(k){
                            case 'custom-uuid':
                            case 'last-compile-time':
                            case 'device-id':
                            case 'lock-id':
                            break;
                            default:
                                putData( k, v );
                            break;
                            }
                        });
                        
                        var settings = {
                            'message_title':'Successful Data Restoration!',
                            'message_message':'',
                        };
                        display_popup_notice( settings );
                        
                        //restore data on server during next upload
                        
                        //refresh
                        document.location = document.location.origin + document.location.pathname;
                    }
                });
            });
        }
    });
    
};

$( document ).on( "pagecreate", "#mngcategory", function() {
	test_for_active_user();
	
	//registered
	handle_form_submission( $('form#category-form') );
	
	//Display List of Suppliers
	update_category_list_on_category_page();
	
	activate_record_delete_button( "#mngcategory" );
	
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
	test_for_active_user();
    //registered
    handle_form_submission( $('form#app_users-form') );
    
    //Display List of Suppliers
    update_users_list_on_users_page( "#mngusers" );
    activate_record_delete_button( "#mngusers" );
    
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

$( document ).on( "pagecreate", "#general-settings", function() {
	test_for_active_user();
	handle_form_submission( $('form#generalsettings-form') );
	
    activate_upload_queue_button();
    
    if( ! ( appSettings && Object.getOwnPropertyNames(appSettings).length ) )
        set_general_settings();
        
    if( appSettings && Object.getOwnPropertyNames(appSettings).length ){
        $.each( appSettings , function(key , value ){
            $('form#generalsettings-form')
            .find('#'+key+'-field')
            .val( value );
        });
        
        $('form#generalsettings-form')
        .find('select')
        .selectmenu( "refresh" );
    }else{
        $('form#generalsettings-form')
        .find('#created_by-field')
        .val( customUUID );
    }
});

function set_general_settings(){
    var object = 'generalsettings';
    if( appSettings && Object.getOwnPropertyNames(appSettings).length ){
        return appSettings;
    }
    
    if( customUUID ){
        var data = getData( object );
        var val = {};
        if( data && Object.getOwnPropertyNames(data).length ){
            $.each( data , function( k , v ){
                var settings = getData( k );
                if( settings && settings.created_by && settings.created_by == customUUID ){
                    val = settings;
                    return;
                }
            });
        }
        
        if( val && Object.getOwnPropertyNames(val).length ){
            appSettings = val;
            configure_appsettings();
            return val;
        }else{
            var default_settings = {
                created_by:customUUID,
                currency:appCurrency+":::"+appCurrencyText,
                discount_type:appDiscountType,
                error:false,
                low_stock_level:appLowStockLevel,
                object:object,
                table_records_display_length:"5",
                printer_character_length:appPrinterCharacterLength,
                printer_line_seperator_length:appPrinterSeperatorLength,
                receipt_message:"Thank you for your patronage!",
                app_mode:appMode,
                notification_frequency:appNotificationFrequency,
                time_to_upload_data:appTimeToUploadData,
                vat:appVATValue,
            };
            var stored = store_record( default_settings );
            if( stored.key ){
                var upload = {};
                upload[ stored.key ] = stored.key;
                queueUpload( upload );
                
                appSettings = stored;
                configure_appsettings();
                return stored;
            }else{
                var settings = {
                    message_title:'Uninitialized Settings',
                    message_message: 'System Failed to Initialize Settings',
                    auto_close: 'yes'
                };
                display_popup_notice( settings );
            }
        }
    }
};

function configure_appsettings(){
    if( appSettings && Object.getOwnPropertyNames(appSettings).length ){
        
        if( appSettings.currency ){
            var currency = appSettings.currency.split(':::');
            if( currency[0] )appCurrency = currency[0];
            if( currency[1] )appCurrencyText = currency[1];
        }
        
        if( appSettings.table_records_display_length && parseFloat(appSettings.table_records_display_length) )
            dataLimit = parseFloat(appSettings.table_records_display_length);
            
        if( appSettings.vat )
            appVATValue = parseFloat(appSettings.vat);
        else
            appVATValue = 0;
            
        if( appSettings.discount_type )
            appDiscountType = appSettings.discount_type;
            
        if( appSettings.low_stock_level && parseFloat( appSettings.low_stock_level ) )
            appLowStockLevel = parseFloat( appSettings.low_stock_level );
            
        if( appSettings.printer_character_length && parseFloat( appSettings.printer_character_length ) )
            appPrinterCharacterLength = parseFloat( appSettings.printer_character_length );
            
        if( appSettings.printer_line_seperator_length && parseFloat( appSettings.printer_line_seperator_length ) )
            appPrinterSeperatorLength = parseFloat( appSettings.printer_line_seperator_length );
            
        if( appSettings.app_mode )
            appMode = appSettings.app_mode;
            
        if( appSettings.notification_frequency )
            appNotificationFrequency = appSettings.notification_frequency;
            
        if( appSettings.time_to_upload_data )
            appTimeToUploadData = parseFloat( appSettings.time_to_upload_data );
    }
};

$( document ).on( "pagecreate", "#notifications", function() {
	test_for_active_user();
    activate_panel_navigation( $("#notifications") );
});

$( document ).on( "pageshow", "#notifications", function() {
	//reset notifications counter
    activate_menu();
    prepare_notifications_for_display( 1 );
    
    if( $('#notifications-container') ){
        $('#notifications-container')
        .collapsibleset( "refresh" );
    }
});

$( document ).on( "pagecreate", "#settings", function() {
	test_for_active_user();
	
    activate_panel_navigation( $("#settings") );
    
	$('#sign-out')
	.on('click', function( e ){
        e.preventDefault();
        
        //check for data to upload
        var a = getData( uploadDataKey );
        if( a && Object.getOwnPropertyNames(a).length ){
            var r = confirm('Do you want to save your updates on our servers before proceeding?\n\nNOTE: Failure to update might lead to loss of data');
			if( r == true ){
                signOut = true;
                uploadData();
            }else{
                signOutUser();
            }
        }else{
            signOutUser();
        }
		
	});

	$('#update-data-with-server')
	.on('click', function( e ){
        e.preventDefault();
        var r = uploadData();
        if( r == 'check-download' )check_for_data_to_download();
	});
});

function signOutUser(){
    create_restore_points(0);
    
    setTimeout( function(){
        clearSingleData( customUUIDkey );
        clearData();
        document.location = document.location.origin + document.location.pathname;
    }, 3000 );
};

$( document ).on( "pageshow", "#settings", function() {
	activate_menu();
    //check for registered user details
	//var userInfo = get_user_info();
	
	//window.requestFileSystem( window.TEMPORARY , 1024*1024 , onInitFs, errorHandler);
	
	/*
	$.each( userInfo , function( k , v ){
		switch( k ){
		default:
			$('form#sign-up-form')
			.find('#'+k+'-field')
			.val( v );
		break;
		}
	} );
	*/
});

function get_last_supply_activity_html( stock ){
	if( stock.format ){
        //for use in refunds/returns
        return '<tr><td>'+stock.item_desc+'</td><td>'+stock.item_qty+'</td></tr>';
    }
    
    var date = new Date(stock.creationtimestamp);
	// hours part from the timestamp
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	stock.date = year+'-'+months_of_year[ month ]+'-'+day;
	
    if( ! stock.item_image )stock.item_image = '';
    
    var img = blubirdFileURL+stock.item_image;
    if( blubirdWebbased ){
        img = 'imagebank/'+stock.item_image;
    }    
    
	return '<tr timestamp="'+stock.creationtimestamp+'"><td class="ui-table-priority-1"><img src="'+img+'" class="ui-li-thumb"></td><td>'+stock.item_desc+'</td><td class="ui-table-priority-2">'+stock.item_qty+'</td><td class="ui-table-priority-3">'+stock.date+'</td></tr>';
	
};

function get_customer_recent_purchases_html( sale ){
	var date = new Date(sale.creationtimestamp);
	// hours part from the timestamp
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	sale.date = year+'-'+months_of_year[ month ]+'-'+day;
    
    var ta = parseFloat( sale.total_amount );
    var a_tendered = parseFloat( sale.total_amount_tendered );
    var ap = 0;
    if( a_tendered <= ta ){
        ap = a_tendered;
    }else{
        ap = a_tendered - ta;
    }
	
	return '<tr timestamp="'+sale.creationtimestamp+'"><td class="ui-table-priority-1">#'+sale.key+'<br />('+sale.date+')</td><td class="ui-table-priority-2">'+formatNum( ta.toFixed(2) )+'</td><td class="ui-table-priority-3">'+formatNum( ap.toFixed(2) )+'</td><td class="ui-table-priority-3">'+sale.total_units+'</td></tr>';
	
};

function get_customer_recent_debt_payments_html( payment ){
	var date = new Date(payment.creationtimestamp);
	// hours part from the timestamp
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	payment.date = year+'-'+months_of_year[ month ]+'-'+day;
    
    var ta = parseFloat( payment.amount_paid );
	
    var remark = '';
    if( payment.remark ){
        remark = '<br><i class="small-remarks">'+payment.remark+'</i>';
    }
    
	return '<tr timestamp="'+payment.creationtimestamp+'"><td class="ui-table-priority-1">#'+payment.key+'<br />('+payment.date+')'+remark+'</td><td class="ui-table-priority-2">'+formatNum( ta.toFixed(2) )+'</td></tr>';
	
};

function get_supplier_recent_debt_payments_html( payment ){
	var date = new Date(payment.creationtimestamp);
	// hours part from the timestamp
	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();
	payment.date = year+'-'+months_of_year[ month ]+'-'+day;
    
    var ta = parseFloat( payment.amount_paid );
	
    var remark = '';
    if( payment.remark ){
        remark = '<br><i class="small-remarks">'+payment.remark+'</i>';
    }
    
	return '<tr timestamp="'+payment.creationtimestamp+'"><td class="ui-table-priority-1">#'+payment.key+'<br />('+payment.date+')'+remark+'</td><td class="ui-table-priority-2">'+formatNum( ta.toFixed(2) )+'</td></tr>';
	
};

function prefixZeroBarcodes( barcode ){
    return barcode;
    var c = barcode;
    switch( c.charAt(0) ){
    case '1': case '2': case '3': case '4':case '5': case '6':case '7': case '8':case '9':
    case 'a': case 'b': case 'c': case 'd':case 'e': case 'f':case 'g': case 'h':case 'i':
    case 'j': case 'k': case 'l': case 'm':case 'n': case 'o':case 'p': case 'q':case 'u':
    case 'r': case 's': case 't': case 'v':case 'w': case 'x':case 'y': case 'z':
    case 'A': case 'B': case 'C': case 'D':case 'E': case 'F':case 'G': case 'H':case 'I':
    case 'J': case 'K': case 'L': case 'M':case 'N': case 'O':case 'P': case 'Q':case 'U':
    case 'R': case 'S': case 'T': case 'V':case 'W': case 'X':case 'Y': case 'Z':
    break;
    default:
        return 'z' + c;
    break;
    }
    return barcode;
};

$( document ).on( "pagecreate", "#newInventory", function() {
	test_for_active_user();
	
	$('a.button-scan')
	.on('click', function(){
		cordova.plugins.barcodeScanner.scan(
		  function (result) {
			 $('form#inventory-form')
			.find( 'input#item_barcode-field' )
			.val( prefixZeroBarcodes( result.text ) );
			
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
	.find( 'input#item_barcode-field' )
	.on('blur', function(){
        var v = prefixZeroBarcodes( $(this).val() );
        
        $(this).val( v );
        
        if( v.length > 5 ){
            d = getData( customUUID +''+ v );
            if( d && d.key ){
                $('#newInventory')
                .find('select#item-select-field')
                .val( d.key )
                .change();
            }
        }
        
    })
    .on('keypress',function(e){
        switch(e.keyCode){
        case 13:    //enter
            $(this).blur();
            e.preventDefault();
            return false;
        break;
        }
    });
    
	$('#newInventory')
	.find('select#item-select-field')
	.on('change', function(){
		var val = $(this).val();
		if( val && val != 'new' ){
			var inventory = getData( val );
			
            if( ! ( inventory.item_stock_type  ) ){
                $('form#inventory-form')
                .find('#infinite-item-checkbox')
                .attr('checked', false )
                .checkboxradio("refresh")
                .change();
            }
            
			$.each( inventory, function(key , value ){
                switch( key ){
                case "item_stock_type":
                    var b = false;
                    if( value == 'on' ){
                        b = true;
                    }
                    
                    $('form#inventory-form')
                    .find('#'+key+'-field')
                    .val(value);
                    
                    $('form#inventory-form')
                    .find('#infinite-item-checkbox')
                    .attr('checked', b )
                    .checkboxradio("refresh")
                    .change();
                    
                break;
                case "item_image":
                case "image":
                    if( value.length == 0 )value = "icon.png";
                    $('form#inventory-form')
                    .find('#'+key+'-field')
                    .val( value );
                break;
                default:
                    $('form#inventory-form')
                    .find('#'+key+'-field')
                    .val( value );
                break;
                }
			});
            
            var img = 'icon.png';
            if( blubirdFileURL ){
                img = blubirdFileURL + inventory.item_image;
            }
            if( inventory.image && inventory.item_image == inventory.image ){
                img = 'imagebank/'+inventory.item_image;
            }
            if( blubirdWebbased ){
                img = 'imagebank/'+inventory.item_image;
            }
            
            $('form#inventory-form')
            .find('#myImage')
            .attr( 'src' , img );
            
            $('#newInventory')
            .find('select[name="category"]')
            .selectmenu('refresh');
		}else{
			$('form#inventory-form')
			.find('input')
			.val('');
            
			$('form#inventory-form')
			.find('input#item_image-field')
			.add('input#image-field')
			.val('icon.png');
            
            $('form#inventory-form')
            .find('#myImage')
            .attr( 'src' , 'icon.png' );
            
            $('#newInventory')
            .find('select[name="category"]')
            .val('')
            .selectmenu('refresh');
            
            $('form#inventory-form')
            .find('#item_stock_type-field')
            .val('0');
            
            $('form#inventory-form')
            .find('#infinite-item-checkbox')
            .attr('checked', false )
            .checkboxradio("refresh")
            .change();
		}
	});
	
	$('#newInventory')
	.find('#capture-image-button')
	.on('click', function(e){
		e.preventDefault();
        //check barcode
        var barcode = $('#newInventory').find('input[name="item_barcode"]').val();
        
        if( barcode && barcode.length > 5 ){
            //Camera.DestinationType.DATA_URL
            navigator.camera.getPicture( gotPictureTest, fail,  { quality : 100, 
              destinationType : Camera.DestinationType.FILE_URI, 
              sourceType : Camera.PictureSourceType.CAMERA, 
              allowEdit : true,
              encodingType: Camera.EncodingType.JPEG,
              targetWidth: 250,
              targetHeight: 250 } );
         }else{
            var settings = {
                message_title:'Invalid Barcode',
                message_message: 'Please provide a Valid Barcode',
                auto_close: 'yes'
            };
            display_popup_notice( settings );
         }
	 });
	 
    $('#newInventory')
    .find('select[name="category"]')
    .on('change', function(){
		if( ( ! $('#newInventory').find('select#item-select-field').val() ) || $('#newInventory').find('select#item-select-field').val() == 'new' ){
            var c2 = '.'+$(this).val();
            
            var $items = $allItemSelectBox.clone();
            
            if( c2.length > 2 ){
                $items
                .find('option')
                .not(c2)
                .remove();
            }
            
            $('#newInventory')
            .find('select#item-select-field')
            .html( '<option value="new">-- Select Item --</option>' + $items.html() )
            .val('')
            .selectmenu('refresh'); 
        }
    });
    
    $('#newInventory')
    .find('#infinite-item-checkbox')
    .on('change', function(){
        if( $(this).is(':checked') )$('#newInventory').find('#item_stock_type-field').val('on');
        else $('#newInventory').find('#item_stock_type-field').val('0');
    });
    
    $('#newInventory')
    .find('#save-multiple-new-items')
    .on('click', function( e ){
        var key = $('form#inventory-form').find('input#key-field').val();
        
        if( ! key ){
            var settings = {
                message_title:'No Item Selected',
                message_message: 'Select an existing Item to Duplicate',
                auto_close: 'no'
            };
            display_popup_notice( settings );
            return false;
        }
        
        var item_details = getData( key );
        if( ! ( item_details && item_details.key )  ){
            var settings = {
                message_title:'No Item Selected',
                message_message: 'Select an existing Item to Duplicate',
                auto_close: 'no'
            };
            display_popup_notice( settings );
            return false;
        }
        
        var upload = {};
        var all_barcodes = prompt("Please enter a comma seperated list of barcodes E.g 231456,531458,736459", $('form#inventory-form').find( 'input#item_barcode-field' ).val().trim() );
        if ( ! all_barcodes ) {
            var settings = {
                message_title:'No Barcode Entered',
                message_message: 'Please enter a comma seperated list of barcodes E.g 231456,531458,736459',
                auto_close: 'no'
            };
            display_popup_notice( settings );
            return false;
        }
        var barcodes = all_barcodes.split(',');
        for( i = 0; i < barcodes.length; i++ ){
            if( ! barcodes[i] )continue;
            
            if( $('form#inventory-form').find( 'input#item_barcode-field' ).val().trim() != barcodes[i] ){
                if( item_details.store )delete item_details['store'];
            }
            
            item_details.item_barcode = barcodes[i].trim();
            var stored = store_record( item_details );
            add_to_list_of_inventory( stored );
            
            upload[ stored.key ] = stored.key;
        }
        
        update_inventory_list_on_inventory_page();
        queueUpload( upload );
        
        $('#newInventory')
        .find('select#item-select-field')
        .val('new')
        .change()
        .selectmenu('refresh');
        
        var settings = {
            message_title:'Duplicates Created!',
            message_message: '',
            auto_close: 'no'
        };
        display_popup_notice( settings );
    });
    
	update_inventory_list_on_inventory_page();
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        var settings = {
			message_title:'Cannot Retrieve Location',
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

var downloadImageKey = 'downloadimage';

var uploadImageKey = 'uploadimage';
var uploadDataKey = 'upload';
var downloadDataKey = 'download';
var chunkSize = 10000;

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
};

function queueUploadImages( data ){
	var upload = getData( uploadImageKey );
	if( ! upload ){
		var upload = {};
	}
	
	if( upload ){
		$.each(data, function( key , val ){
			upload[key] = val;
		});
	}else{
		upload = data;
	}
	
	putData( uploadImageKey , upload );
};

function unQueueUpload( data ){
	var upload = getData( uploadDataKey );
	if( ! upload )upload = {};
	if( upload && data.key ){
		upload[data.key] = data;
	}
	putData( uploadDataKey , upload );
};

var uploadDataSize = 0;
var internetConnection = true;

function uploadData(){
    //check for internet connection
    if( ! internetConnection ){
        //display no internet connection message
        $('div.progress-bar-container')
		.html('<div class="no-internet-bar"><div class="progress-bar"></div></div>');
        return false;
    }
	var a = getData( uploadDataKey );
    
    if( a && Object.getOwnPropertyNames(a).length ){
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
            if( value["delete"] && value["delete"] == 'delete' )
                d[ key ] = value;
            else
                d[ key ] = getData( key );
                
            ++x;
        });
        b = $.param( d );
        
        uploadDataSize = b.length;
        
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
        ajax_get_url = '?action=upload_data&todo=get_last_upload_dataset';
        ajax_send();
        
        //REMOVE LATER - for airtel
        //uploadFiles();
    }else{
        return 'check-download';
    }
};

var uploadingImageInprogess = 0;
var uploadingImageKey = '';
function uploadFiles() {
    
    if( uploadingImageInprogess )return false;
    
    var img = getData( uploadImageKey );
    var imageURI = '';
    
    if( img && Object.getOwnPropertyNames(img).length ){
        $.each( img, function( k , v ){
            if( v ){
                uploadingImageKey = k;
                imageURI = v;
                return false;
            }else{
                delete img[ k ];
            }
        });
        
        putData( uploadImageKey , img );
    }
    
    if( imageURI ){
        uploadingImageInprogess = 1;
        
        var options = new FileUploadOptions();
        options.fileKey = "imagefile";
        options.fileName = imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType = "image/jpeg";

        var params = new Object();
        params.app_uid = customUUID;
        var user = get_user_info();
		if( user && user.key ){
			params.app_user_id = user.key;
			params.store_id = currentStoreID;
			params.store_owner_id = customUUID;
		}
        
        options.params = params;
        options.chunkedMode = false;

        var ft = new FileTransfer();
        ft.upload( imageURI, pagepointer+"php/uploader.php", successFileUpload, fail, options );
    }else{
        var settings = {
			message_title:'No File to Upload',
			message_message: '',
			auto_close: 'yes'
		};
		//display_popup_notice( settings );
        
        if( img && img[ uploadingImageKey ] ){
            delete img[ uploadingImageKey ];
            putData( uploadImageKey , img );
        }
        
        if( signOut ){
            signOutUser();
        }
    }
};

function successFileUpload(r) {
    uploadingImageInprogess = 0;
    
    var img = getData( uploadImageKey );
    if( img && img[uploadingImageKey] ){
        delete uploadingImageKey;
        putData( uploadImageKey , img );
    }
    uploadFiles();
};

function get_active_page_id(){
	var active_page = $( "body" ).pagecontainer( "getActivePage" );
	var active_page_id = active_page.context.location.hash;
	return active_page_id;
};

function check_for_data_to_upload( $page ){
    var a = getData( uploadDataKey );
    if( a && Object.getOwnPropertyNames(a).length ){
        $page
        .find('.update-server-button-container')
        .removeClass( 'hidden' );
    }else{
        if( ! $page.find('.update-server-button-container').hasClass('hidden') ){
            $page
            .find('.update-server-button-container')
            .addClass('hidden');
        }
    }
};

function activate_manual_upload_data_button_click_event( $page ){
    $page
    .find('.update-server-button')
    .on('click', function( e ){
        e.preventDefault();
        
        $(this)
        .parents('.update-server-button-container')
        .addClass('hidden');
        
        internetConnection = true;
        
        uploadData();
    });
};

function downloadFiles(){
    if( ! blubirdFileURL ){
        window.requestFileSystem( LocalFileSystem.PERSISTENT, 0, initFileSystem, fail );
    }
    
    if( blubirdFileURL ){
        var pendingImages = getData( downloadImageKey );
        var file = {};
        
        if( pendingImages ){
            $.each( pendingImages , function( k , v ){
                if( v && v.length > 4 ){
                    file.name = v;
                    file.id = k;
                }
                
                if( file.name ){
                    return false;
                }
            });
        }
        
        if( file && file.name ){
            window.resolveLocalFileSystemURL( blubirdFileURL + file.name , function(){
                //file exists - //clear file key from download list
                clearFileKeyFromDownloadList();
                downloadFiles();
                
            } , function(){
                var fileTransfer = new FileTransfer();
                
                fileTransfer.download(
                    pagepointer + "files/" + customUUID + "/" + file.name,
                    blubirdFileURL + file.name,
                    function( theFile ) {
                        
                        if( $('#downloading-image-files-container') && $('#downloading-image-files-container').attr('src') ){
                            $('#downloading-image-files-container')
                            .attr( 'src' , theFile.toURI()  );
                        }
                        //clear file key from download list
                        clearFileKeyFromDownloadList();
                        
                        //call download / recurse
                        downloadFiles();
                    },
                    function(error) {
                        clearFileKeyFromDownloadList();
                        downloadFiles();
                    }
                );
            } );
        }else{
            return 1;
            //document.location = document.location.origin + document.location.pathname;
            //$.mobile.navigate( "#dashboard", { transition : "none" });
        }
    }else{
        var settings = {
			message_title:'Invalid File System Path',
			message_message: 'File Download Not Initiated',
			auto_close: 'yes'
		};
		display_popup_notice( settings );
        return 1;
        //document.location = document.location.origin + document.location.pathname;
        //$.mobile.navigate( "#dashboard", { transition : "none" });
    }
    
};

function movePackedFiles(){
    var d = downloadFiles();
    if( d ){
        document.location = document.location.origin + document.location.pathname;
    }
};

function clearFileKeyFromDownloadList(){
    var pendingImages = getData( downloadImageKey );
    var filekey = '';
    $.each( pendingImages , function( k , v ){
        filekey = k;
        return false;
    });
    
    if( pendingImages[ filekey ] )
        delete pendingImages[ filekey ];
    
    putData( downloadImageKey , pendingImages );
};

$( document ).on( "pageshow", "#newInventory", function() {
	//populate_suppliers_select_box( $('#inventory-form').find('select[name="supplier"]') );
	if( ! currentStoreID )
        populate_stores_select_box( $('#inventory-form').find('select[name="category"]') ); //hack to allow creation of records if webpage is refreshed
    
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
		.html( html )
        .selectmenu("refresh");
	}
};

function populate_category_select_box( $element ){
	//Update Suppliers Combo
	var suppliers = get_list_of_category();
	var html = '<option value="">- Select Category -</option>';
	$.each( suppliers , function( key , value ){
		html += '<option value="'+key+'">'+value.category+'</option>';
	});
	
	if( html ){
		$element
		.html( html )
        .selectmenu("refresh");
	}
};

function populate_stores_select_box( $element ){
	//Update Suppliers Combo
	var stores = get_list_of_stores();
    
    if( $element.hasClass('currently-active-store') ){
        var html = '';
    }else{
        var html = '<option value=""> - Select Store - </option>';
    }
	
    var count = 0;
    var tmpStoreID = '';
	$.each( stores , function( key , value ){
        if( value && value.name ){
            if( currentStoreID == key )
               html = '<option value="'+key+'">'+value.name+' ('+value.street+')</option>' + html;
            else
                html += '<option value="'+key+'">'+value.name+' ('+value.street+')</option>';
               
            ++count;
            
            if( ! tmpStoreID )tmpStoreID = key;
        }
	});
	
    if( ! currentStoreID )
    currentStoreID = tmpStoreID;
    
    numOfStores = count;
    
	if( html ){
		$element
		.html( html )
        .selectmenu( "refresh" );
	}
    
    if( numOfStores > 1 ){
        if( $element.hasClass('currently-active-store') ){
            $element
            .parents('.currently-active-store-container')
            .removeClass('hidden');
        }
    }else{
        if( $element.hasClass('currently-active-store') ){
            $element
            .parents('.currently-active-store-container')
            .addClass('hidden');
        }
    }
};

$( document ).on( "pagecreate", "#stockLevels", function() {
	test_for_active_user();
    activate_update_of_current_store( $("#stockLevels") );
    
	activate_item_filtering( "stockLevels" );
});

$( document ).on( "pageshow", "#stockLevels", function() {
	populate_stores_select_box( $('#stockLevels').find('select.currently-active-store') );
    
    populate_category_select_box( $('#stockLevels').find('#filter-category-field') );
    
	//Update inventory list
	var inventory = get_list_of_inventory();
	display_table_on_inventory_page( inventory, $('#stockLevels').find('tbody.stockLevels-container') , $('#stockLevels') , 0 , 1, 1, 0 );
    
});

var pricingData = {};

$( document ).on( "pagecreate", "#setPricing", function() {
	
	test_for_active_user();
	activate_upload_queue_button();
	activate_update_of_current_store( $("#setPricing") );
    
	$('#set-inventory-pricing-1')
	.on('click', function( e ){
		$.mobile.navigate( "#cnfrmPricing", { transition : "none" });
	});
    
	$('#set-inventory-pricing-discard-changes')
	.on('click', function( e ){
        pricingData = {};
		$.mobile.navigate( "#inventory", { transition : "none" });
	});
	
	activate_item_filtering( "setPricing" );

});

var debounceItemFIltersTimeout;
var debounceItemFIltersPage;

var debounceRestockItemTimeout;
var debounceRestockItemPage;

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
	
    if( currentStoreID ){	
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
                if( inventory && ( ( inventory.store && inventory.store[ currentStoreID ] ) || ( inventory.item_stock_type && inventory.item_stock_type == 'on' ) ) ){
                    inventory.selling_price = sp;
                    
                    inventory.timestamp = timestamp;
                    
                    putData( key , inventory );
                    add_to_list_of_inventory( inventory );
                    
                    upload[ key ] = key;
                    
                    var check = 1;
                    
                    if( inventory.item_stock_type && inventory.item_stock_type == 'on' ){
                        check = 0;
                    }
                    
                    if( check ){
                        inventory.store[ currentStoreID ].selling_price = sp;
                        if( inventory.store[ currentStoreID ].stock ){
                            $.each( inventory.store[ currentStoreID ].stock , function( k , v ){
                                var stock = getData( k );
                                if( stock ){
                                    stock.selling_price = sp;
                                    stock.timestamp = timestamp;
                                    putData( k , stock );
                                    upload[ key ] = key;
                                }
                            } );
                        }
                    }
                    html += '<tr><td>'+i+'</td><td>'+val.item+'</td><td>'+formatNum(cp.toFixed(2))+'</td><td>'+formatNum(sp.toFixed(2))+'</td></tr>';
                }
            });
            
            queueUpload( upload );
        }else{
            html = '<tr><td colspan="4" style="text-align:center;">No changes were made</td></tr>';
        }
	}else{
        html = '<tr><td colspan="4" style="text-align:center;">Go Back and Select a Store, create one if none exists</td></tr>';
    }
	$('tbody#selling-price-of-items')
	.html( html );
});

$( document ).on( "pageshow", "#setPricing", function() {
	populate_stores_select_box( $('#setPricing').find('select.currently-active-store') );
    
    populate_category_select_box( $('#setPricing').find('#filter-category-field') );
    
    var inventory = get_list_of_inventory();
    display_table_on_inventory_page( inventory, $('#setPricing').find('tbody.stockLevels-container') , $('#setPricing') , 0 , 0, 1, 0 );
});

$( document ).on( "pagecreate", "#restock", function() {
	test_for_active_user();
	activate_upload_queue_button();
    
	activate_update_of_current_store( $("#restock") );
    
	//registered
	handle_form_submission( $('form#stock-form') );
	handle_form_submission( $('form#supply-form') );
	
	$('#manage-inventory-back-button')
    .add('#retock-bottom-back-button')
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
	
    $('form#stock-form')
	.find('select[name="item_barcode"]')
	.on('change' , function(){
		if( $(this).val() ){
			var key = $(this).val();
			var inventory = get_list_of_inventory();
			
			var $form = $(this).parents('form');
			
			if( inventory[key] ){
                //check for infinite item
                if( inventory[key].item_stock_type && inventory[key].item_stock_type == 'on' ){
                    var settings = {
                        message_title:'Infinite Item',
                        message_message: 'You cannot stock an item that is set at infinity\nItem Name: '+inventory[key].item_desc + '\n\nTo stock this item you must first modify its details in the New Item Menu and set the Always in-stock value to false',
                        auto_close: 'yes'
                    };
                    display_popup_notice( settings );
                    
                    $(this).val('').selectmenu("refresh");
                    return false;
                }
                
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
                
                if( currentStoreID && inventory[key] && inventory[key].store && inventory[key].store[ currentStoreID ] ){
                    $.each( inventory[key].store[ currentStoreID ] , function( key , value ){
                        if( value ){
                            $form
                            .find('#'+key+'-field')
                            .val( value );
                        }
                    });
                }
			}
		}
	});
	
    $('#restock')
	.find('select#filter-category-field')
	.on('change', function(){
		
		var c2 = '.'+$(this).val();
		
        var $items = $allItemSelectBox.clone();
        
		if( c2.length > 2 ){
			$items
			.find('option')
			.not(c2)
			.remove();
        }
		
        $('#stock-form')
        .find('select[name="item_barcode"]')
        .html( selectItemOption + $items.html() )
        .val('')
        .selectmenu('refresh');
	});
	
    $('#restock')
	.find('#search-item-desc-barcode')
    .on( "keyup", function () {
        if( debounceRestockItemTimeout )clearTimeout( debounceRestockItemTimeout );
        debounceRestockItemPage = 'restock';
        debounceRestockItemTimeout = setTimeout( debounceRestockItem, 200 );
    })
    .on('keypress', function(){ $( this ).keyup(); });
    
    $('#restock')
    .find('a.ui-input-clear')
    .on('click', function(){
        
        $('form#stock-form')
        .find('select[name="item_barcode"]')
        .html( $allItemSelectBox.html() )
        .val('')
        .selectmenu('refresh');
    });
    
	$('form#stock-form')
	.add( 'form#stock-form #cost_price-field' )
	.on('change', function(){
		var cp = parseFloat( $('form#stock-form #cost_price-field').val() );
		
		if( ! cp )cp = 0;
		
		var q = parseFloat( $('form#stock-form #item_qty-field').val() );
		var tcp = cp * q;
		
		if( ! tcp )tcp = 0;
		
		$('form#stock-form #dummy-totalCostPrice').val( formatNum( tcp.toFixed(2) ) );
	})
	.on('keyup', function(){
		$(this).change();
	});
	
    $('form#stock-form')
    .find('#stock-multiple-items')
    .on('click', function( e ){
        var data = transform_data( $('form#stock-form') );
		
		if( data.error ){
			//display error message
			var settings = {
				message_title:data.title,
				message_message: data.message,
				auto_close: 'no'
			};
			display_popup_notice( settings );
            return false;
		}else{
            var id = $('form#stock-form').find('select[name="item_barcode"]').val();
            var new_id = '';
            if( id ){
                var new_id = id.replace(customUUID, '' );
                new_id.trim();
            }
            
            var all_barcodes = prompt("Please enter a comma seperated list of keys E.g 231456,531458,736459", new_id );
            if ( ! all_barcodes ) {
                var settings = {
                    message_title:'No Barcode Entered',
                    message_message: 'Please enter a comma seperated list of barcodes E.g 231456,531458,736459',
                    auto_close: 'no'
                };
                display_popup_notice( settings );
                return false;
            }
            
            data.object = "stock";
            
            var barcodes = all_barcodes.split(',');
            for( i = 0; i < barcodes.length; i++ ){
                if( ! barcodes[i] )continue;
                
                data.item_barcode = customUUID +''+ barcodes[i].trim();
                var stored = store_record( data );
                successful_submit_stock_form( stored );
            }
        }
        
        $('#stock-form')
        .find('input')
        .not('.do-not-clear')
        .val('');
        
        $('#stock-form')
        .find('select#supplier-field')
        .selectmenu('refresh');
        
        var settings = {
            message_title:'Multiple Items Stocked!',
            message_message: '',
            auto_close: 'no'
        };
        display_popup_notice( settings );
    });
    
	$('form#supply-form')
	.find('#total_amount_paid-field')
	.on('change', function(){
		var ap = parseFloat( $(this).val() );
		
		var tcp = parseFloat( $('form#supply-form #total_amount-field').val() );
			
		if( ! tcp )tcp = 0;
		if( ! ap )ap = 0;
		
		var ao = tcp - ap;
		
		$('form#supply-form #total_amount_owed-dummy').val( formatNum( ao.toFixed(2) ) );
	})
	.on('keyup', function(){
		$(this).change();
	});
	
    $('#retock-bottom-next-button')
    .on('click', function(e){
        e.preventDefault();
        
        $( 'form#stock-form #cost_price-field' )
        .focus();
    });
    
    $('form#stock-form')
	.find('#selling_price-field')
	.add( 'form#stock-form #cost_price-field' )
	.on('change', function(){
		var cp = parseFloat( $('form#stock-form #cost_price-field').val() );
		var sp = parseFloat( $('form#stock-form #selling_price-field').val() );
		
		if( ! cp )cp = 0;
		
		var m = 0;
		if( sp )m = ( ( sp - cp ) / sp ) * 100;
		
		$('#inventory-gross-margin').text( m.toFixed(2) + '%' );
		
		switch( $(this).attr('id') ){
		case 'cost_price-field':
			var q = parseFloat( $('form#stock-form #item_qty-field').val() );
			var tcp = cp * q;
			
			if( ! tcp )tcp = 0;
			
			$('form#stock-form #dummy-totalCostPrice').val( $('form#stock-form #dummy-totalCostPrice').attr('placeholder')+formatNum( tcp.toFixed(2) ) );
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
    
});

function debounceRestockItem(){
    if( debounceRestockItemTimeout )clearTimeout( debounceRestockItemTimeout );
    
    if( currentStoreID ){
    
        var $input = $( '#'+debounceRestockItemPage ).find('#search-item-desc-barcode'),
        v = $input.val(),
        html = "";
       
        if( v.length > 5 ){
            d = getData( customUUID +''+ v );
            if( d && d.key ){
                //display item using select box
                $('form#stock-form')
                .find('select[name="item_barcode"]')
                .val( d.key )
                .selectmenu('refresh')
                .change();
                
                $input.val('');
                return false;
            }
        }
        
        var $itemselect = $('form#stock-form').find('select[name="item_barcode"]');
        var select_html = '';
            
        if ( v && v.length > 2 ) {
            //Update inventory list
            var $items = $allItemSelectBox.clone();
            
            var tempInventory = {};
            
            //perform search
            $items
            .find("option")
            .each(function(){
                var t = new RegExp(v, "i");
                var vl = $(this).text();
                
                if( ! ( t.test(vl) ) ){
                    $(this).remove();
                    return;
                }
                select_html = 1;
            });
            
        }
        
        if( select_html ){
            $itemselect
            .html( selectItemOption + $items.html() )
            .val('')
            .selectmenu('refresh');
        }
        
        if( v.length == 0 ){
            $itemselect
            .html( $allItemSelectBox.html() )
            .val('')
            .selectmenu('refresh');
        }
    }
};

$( document ).on( "pagecreate", "#damages", function() {
	test_for_active_user();
	activate_upload_queue_button();
    
	activate_update_of_current_store( $("#damages") );
    
	//registered
	handle_form_submission( $('form#damages-form') );
	
    activate_item_filtering( "damages" );
    
    $('a.button-scan')
	.on('click', function(){
		cordova.plugins.barcodeScanner.scan(
		  function (result) {
			$("#damages")
            .find('input.item-search-field')
			.val( prefixZeroBarcodes( result.text ) );
            
			$("#damages")
            .find('select[name="item_barcode"]')
            .val( prefixZeroBarcodes( result.text ) )
            .selectmenu("refresh")
            .change();
		  }, 
		  function (error) {
			  alert("Scanning failed: " + error);
		  }
	   );
	});
	
});

$( document ).on( "pagecreate", "#transferStock", function() {
	test_for_active_user();
	activate_upload_queue_button();
    
	activate_update_of_current_store( $("#transferStock") );
    
	//registered
	handle_form_submission( $('form#transferstock-form') );
	
	$('select[name="item_barcode"]')
	.on('change' , function(){
		if( $(this).val() ){
            $("#transferStock")
            .find('input.item-search-field')
			.val( $(this).val() );
		}
	});
	
	$('#transferstock-form select#filter-category-field')
	.on('change', function(){
		
		var c2 = '.'+$('#transferstock-form select#filter-category-field').val().replace(' ','-');
		
		$('#transferstock-form')
		.find('select[name="item_barcode"]')
		.find('option')
		.show();
		
		if( c2.length > 2 ){
			$('#transferstock-form')
			.find('select[name="item_barcode"]')
			.find('option')
			.not(c2)
			.hide();
		}
        
		$('#transferstock-form')
		.find('select[name="item_barcode"]')
        .selectmenu('refresh');
	});
	
    $('a.button-scan')
	.on('click', function(){
		cordova.plugins.barcodeScanner.scan(
		  function (result) {
			$("#transferStock")
            .find('input.item-search-field')
			.val( prefixZeroBarcodes( result.text ) );
            
			$("#transferStock")
            .find('select[name="item_barcode"]')
            .val( prefixZeroBarcodes( result.text ) )
            .selectmenu("refresh")
            .change();
		  }, 
		  function (error) {
			  alert("Scanning failed: " + error);
		  }
	   );
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
			case 'stock':
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
					.val( formatNum( val.toFixed(2) ) );
				}
			break;
			}
		});
		
	}
};

$( document ).on( "pagecreate", "#inventory", function() {
	test_for_active_user();
    activate_panel_navigation( $("#inventory") );
    
    activate_item_filtering( "inventory" );
    
    activate_update_of_current_store( $("#inventory") );
    activate_manual_upload_data_button_click_event( $("#inventory") );
    
    $('#clear-all-stock')
    .on('click', function(e){
        e.preventDefault();
        
        var settings = {
            message_title:'Click ok & wait for data to be cleared',
            message_message:'',
            auto_close: 'yes'
        };
        display_popup_notice( settings );
        
        var supply = getData( 'supply' );
        var suppliers = getData( 'suppliers' );
        var stock = getData( 'stock' );
        var inventory = getData( 'inventory' );
        
        $.each( suppliers, function(key, value){
            var supplier = getData( key );
            supplier.stock = {};
            putData( key, supplier );
            if( ! storeObjects[ 'suppliers_list' ] )storeObjects[ 'suppliers_list' ] = {};
            storeObjects[ 'suppliers_list' ][ key ] = supplier;
        });
        
        $.each( supply, function(key, value){
            clearSingleData( key );
            unQueueUpload( {key:key, object:'supply', "delete":"delete" } );
        });
        
        $.each( stock, function(key, value){
            clearSingleData( key );
            unQueueUpload( {key:key, object:'stock', "delete":"delete" } );
        });
        
        $.each( inventory, function(key, value){
            clearSingleData( key );
            unQueueUpload( {key:key, object:'inventory', "delete":"delete" } );
        });
        
        storeObjects[ 'inventory_list' ] = {};
        storeObjects[ 'expenses_list' ] = {};
        
        var settings = {
            message_title:'Data has been successfully cleared!',
            message_message:'',
            auto_close: 'yes'
        };
        display_popup_notice( settings );
        document.location = document.location.origin + document.location.pathname + document.location.search;
        /*
        if( data.timestamp ){
            var date = new Date( data.timestamp );
            var day = date.getDate();
            var month = date.getMonth();
            var year = date.getFullYear();
            
            if( day < 10 )day = '0'+day;
            if( month < 10 )month = '0'+month;
            var cache_key = 'stock' + year + '-' + month + '-' + day;
            
            var cache = getData( cache_key );
            if( cache && cache[ key ] )
                delete cache[ key ];
                
            putData( cache_key , cache );
        }
        */
    });
});

$( document ).on( "pageshow", "#inventory", function() {
	var userInfo = get_user_info();
	
    activate_menu();
    
	populate_category_select_box( $('#inventory').find('#filter-category-field') );
    populate_stores_select_box( $('#inventory').find('select.currently-active-store') );
	
    check_for_data_to_upload( $('#inventory') );
    
	//Update inventory list
	var inventory = get_list_of_inventory();
    display_table_on_inventory_page( inventory, $('tbody.stockLevels-container') , $('#inventory') , 1 , 1 , 1, 0 );
    
});

function activate_item_filtering( page ){
    if( ! page ){
        var page = get_active_page_id();
    }
    
	$("#"+page)
	.find('select#filter-category-field')
	.on('change', function(){
		
        var $itemselect = $("#"+page).find('select#filter-item-field');
        
		var c2 = '.'+$("#"+page).find('select#filter-category-field').val();
		
        var empty_msg = 'No Item in Stock';
        var include_supplier = 0;
        var $tablebody = $("#"+page).find('tbody.stockLevels-container');
        switch( page ){
        case 'inventory':
        case 'stockLevels':
            include_supplier = 1;
        break;
        case 'damages':
            $tablebody = $("#"+page).find('tbody#damages-list-container');
            empty_msg = 'There is no reported damage';
        break;
        }
            
        $tablebody
		.find('tr')
		.show();
		
        var $items = $itemSelectBox.clone();
        
		if( c2.length > 2 ){
            
            $items
			.find('option')
			.not(c2)
			.remove();
			
            var tempInventory = {};
            $items
            .find('option')
            .each(function(){
                var i = getData( $(this).val() );
                if( i && i.key ){
                    tempInventory[i.key] = i;
                }
            });
            
            if( tempInventory && Object.getOwnPropertyNames( tempInventory ).length ){
                display_table_on_inventory_page( tempInventory, $tablebody , $("#"+page) , 0, include_supplier , 0 , 1 );
            }else{
                $tablebody
                .html('<tr><td colspan="5">'+empty_msg+'</td></tr>');
            }
		}
        
        if( c2.length == 1 ){
            var inventory = get_list_of_inventory();
            display_table_on_inventory_page( inventory, $tablebody , $("#"+page) , 0, include_supplier , 0 , 1 );
        }
        
        $itemselect
        .html( selectItemOption + $items.html() )
        .val('')
        .selectmenu('refresh');
	});
    
    $("#"+page)
	.find('select#filter-item-field')
	.on('change', function(){
        var content = $(this).val();
        
        var empty_msg = 'No Item in Stock';
        var include_supplier = 0;
        var $tablebody = $("#"+page).find('tbody.stockLevels-container');
        switch( page ){
        case 'inventory':
        case 'stockLevels':
            include_supplier = 1;
        break;
        case 'damages':
            $tablebody = $("#"+page).find('tbody#damages-list-container');
            empty_msg = 'There is no reported damage';
        break;
        }
        
        if( content ){
            var inventory = getData( content );
            if( inventory && inventory.item_desc && inventory.key ){
                
                var i = {};
                i[ inventory.key ] = inventory;
                display_table_on_inventory_page( i , $tablebody , $("#"+page) , 0 , include_supplier , 0, 1 );
                
                $("#"+page)
                .find('#item_barcode-field')
                .val( content )
                .selectmenu('refresh');
                
                return false;
            }
        }else{
            var inventory = get_list_of_inventory();
            display_table_on_inventory_page( inventory, $tablebody , $("#"+page) , 0, include_supplier , 0 , 1 );
        }
        
        $("#"+page)
        .find('select#filter-category-field')
        .change();
        
	});
   
    $("#"+page)
	.find('#search-item-desc-barcode')
    .on( "keyup", function () {
        if( debounceItemFIltersTimeout )clearTimeout( debounceItemFIltersTimeout );
        debounceItemFIltersPage = page;
        debounceItemFIltersTimeout = setTimeout( debounceItemFIlters, 200 );
    })
    .on('keypress', function(){ $( this ).keyup(); });
    
    $("#"+page)
	.find('#search-item-desc-barcode')
    .find('a')
    .on('click', function(){
        $("#"+page)
        .find('select#filter-item-field')
        .add('select[name="item_barcode"]')
        .html( selectItemOption + $itemSelectBox.html() )
        .val('')
        .selectmenu('refresh');
    });
};

function debounceItemFIlters(){
    if( debounceItemFIltersTimeout )clearTimeout( debounceItemFIltersTimeout );
    
    if( currentStoreID ){
        
        var page = debounceItemFIltersPage;
        var $input = $("#"+page).find('#search-item-desc-barcode');
        var v = $input.val();
        var html = "";
       
        if( v.length > 5 ){
            d = getData( customUUID +''+ v );
            if( d && d.key ){
                //display item using select box
                $("#"+page)
                .find('select#filter-item-field')
                .val( d.key )
                .selectmenu('refresh')
                .change();
                
                $input.val('');
                return false;
            }
        }
        
        var $itemselect = $("#"+page).find('select#filter-item-field');
        var select_html = '';
        
        $("#"+page)
        .find('tbody.stockLevels-container')
        .find('tr')
        .show();
        
        if ( v && v.length > 2 ) {
            //Update inventory list
            var $items = $itemSelectBox.clone();
            
            var tempInventory = {};
            
            //perform search
            $items
            .find("option")
            .each(function(){
                var t = new RegExp(v, "i");
                var vl = $(this).text();
                
                if( ! ( t.test(vl) ) ){
                    $(this).remove();
                    return;
                }
                
                var i = getData( $(this).attr('value') );
                if( i && i.store && i.store[ currentStoreID ] ){
                    tempInventory[i.key] = i;
                    select_html += '<option value="'+i.key+'">'+i.item_desc+'</option>';
                }
            });
               
            var include_supplier = 0;
            var empty_msg = 'We did not find any item in Stock';
            var $tablebody = $("#"+page).find('tbody.stockLevels-container');
            switch( page ){
            case 'inventory':
            case 'stockLevels':
                include_supplier = 1;
            break;
            case 'damages':
                $tablebody = $("#"+page).find('tbody#damages-list-container');
                empty_msg = 'There is no reported damage';
            break;
            }
            
            if( tempInventory && Object.getOwnPropertyNames( tempInventory ).length ){
                display_table_on_inventory_page( tempInventory, $tablebody , $("#"+page) , 0, include_supplier , 0 , 1 );
                
                $tablebody
                .find('tr')
                .on('click', function(e){
                    e.preventDefault();
                    
                    var page = get_active_page_id();
                    
                    $("#"+page)
                    .find('select#filter-item-field')
                    .val( $(this).attr('id') )
                    .selectmenu('refresh');
                });
                 
            }else{
                $tablebody
                .html('<tr><td colspan="5">'+empty_msg+'</td></tr>');
            }
        }
        
        if( v.length == 0 ){
            var empty_msg = 'No Item in Stock';
        var include_supplier = 0;
        var $tablebody = $("#"+page).find('tbody.stockLevels-container');
        switch( page ){
        case 'inventory':
        case 'stockLevels':
            include_supplier = 1;
        break;
        case 'damages':
            $tablebody = $("#"+page).find('tbody#damages-list-container');
            empty_msg = 'There is no reported damage';
        break;
        }
            var inventory = get_list_of_inventory();
            display_table_on_inventory_page( inventory, $tablebody , $("#"+page) , 0, include_supplier , 0 , 1 );
        }
        
        if( select_html ){
            $itemselect
            .html( selectItemOption + $items.html() )
            .val('')
            .selectmenu('refresh');
            
            switch( page ){
            case 'damages':
                $("#damages")
                .find('select[name="item_barcode"]')
                .html( selectItemOption + $items.html() )
                .val('')
                .selectmenu('refresh');
            break;
            }
        }
    }
};

function display_table_on_inventory_page( inventory, $tbody, $page, include_summary, include_supplier, reload_item_list , display_err ){
    var page = get_active_page_id();
    
    var html = '';
	
    var label = new Array();
	var values = new Array();
	var i = 0;
	
	var total_value = 0;
    var total_value_cp = 0;
    var total_value_gp = 0;
	var total_items = 0;
    
	var html2 = selectItemOption;
    
    var maxs = new Array();
    var maxs_html = new Array();
    var maxs_html_count = 0;
    for( var i = 0; i < dataLimit; i++ )
        maxs[i] = 0;
    
    var show_error = 0;
    var error_html = '';
    
    if( currentStoreID ){
        $.each( inventory , function( key , value ){
            if( ( value && value.store && value.store[ currentStoreID ] ) || ( value && value.item_stock_type && value.item_stock_type == 'on' ) ){
                
                var storeStock = {cost_price:0, selling_price:0 };
                if( value.store && value.store[ currentStoreID ] )
                    var storeStock = value.store[ currentStoreID ];
                
                switch(page){
                case "damages":
                    include_supplier = 0;
                    var qty = -1;
                    display_err = 0;
                    if( storeStock.damages && Object.getOwnPropertyNames( storeStock.damages ).length ){
                        qty = 0;//not important - just prevents error display
                        value.damages = storeStock.damages;
                    }
                break;
                default:
                    if( ! storeStock.item_sold )storeStock.item_sold = 0;
                    if( ! storeStock.item_damaged )storeStock.item_damaged = 0;
                    
                    label[i] = value.item_desc;
                    
                    if( ! ( value.item_stock_type && value.item_stock_type == 'on' ) ){
                        value.selling_price = storeStock.selling_price;
                        value.cost_price = storeStock.cost_price;
                    }
                    
                    if( value.item_stock_type && value.item_stock_type == 'on' ){
                        value.item_qty = 1;
                        value.item_sold = 0;
                        value.item_damaged = 0;
                        var qty = 1;
                    }else{
                        value.item_qty = storeStock.item_qty;
                        value.item_sold = storeStock.item_sold;
                        value.item_damaged = storeStock.item_damaged;
                        
                        var qty = parseFloat( value.item_qty - ( value.item_sold + value.item_damaged ) );
                        
                        values[i] = ( parseFloat( value.item_qty ) - ( parseFloat( value.item_sold ) + parseFloat( value.item_damaged ) ) );
                        
                        tv = ( parseFloat( value.item_qty ) - ( parseFloat( value.item_sold ) + parseFloat( value.item_damaged ) ) ) * value.selling_price;
                        if( tv > 0 )total_value += tv;
                        
                        tv = 0;
                        tv = ( parseFloat( value.item_qty ) - ( parseFloat( value.item_sold ) + parseFloat( value.item_damaged ) ) )* value.cost_price;
                        if( tv > 0 )total_value_cp += tv;
                        
                        
                        ti = ( parseFloat( value.item_qty ) - ( parseFloat( value.item_sold ) + parseFloat( value.item_damaged ) ) );
                        if( ti > 0 )total_items += ti;
                        
                    }
                break;
                }
                ++i;
                
                //create client side notification instead
                if( display_err && qty < 0 ){
                    show_error = 1;
                    error_html += '\n\nItem Name: '+value.item_desc + '\nItem Quantity: '+qty;
                }
                
                //Last Five
                if( value.timestamp && qty > -1 ){
                    var sort_field = value.timestamp;
                    for( var i = 0; i < dataLimit; i++ ){
                        if( sort_field > maxs[i] ){
                            var k = i + 1;
                            for( var j = k; j < dataLimit; j++ ){
                                maxs[j] = maxs[j - 1];
                                maxs_html[ dataLimit - j ] = maxs_html[ dataLimit - j - 1];
                            }
                            
                            if( include_supplier && storeStock && storeStock.stock ){
                                $.each( storeStock.stock, function( sup_id , vv ){
                                    value.supplier = sup_id;
                                    return;
                                });
                            }
                            
                            maxs[i] = parseFloat( sort_field ) - 1;
                            
                            switch(page){
                            case "setPricing":
                                maxs_html[i] = get_inventory_set_pricing_html( key , value );
                            break;
                            case "damages":
                                maxs_html[i] = get_damages_html( key , value );
                            break;
                            default:
                                maxs_html[i] = get_inventory_html( key , value );
                            break;
                            }
                            
                            break;
                        }
                    }
                }
                
                html2 += '<option value="'+key+'" class="'+value.category+'">'+value.item_desc+' ['+value.item_barcode+']</option>';
            }
        });
        
        html = maxs_html.join(" ");
	}
    
	if( html ){
		$tbody
		.html( html )
		.find('tr')
        .tsort({attr:'timestamp', order:'desc'});
		
        if( reload_item_list ){
            $page
            .find('#filter-item-field')
            .html( html2 )
            .selectmenu("refresh")
            .find('option')
            .tsort();
            
            $itemSelectBox = $page.find('#filter-item-field').clone();
            
            $itemSelectBox
            .find('option[value=""]')
            .remove();
        }
        
        switch(page){
        case "setPricing":
            $page
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
        break;
        }
	}
    
    if( include_summary ){
        total_value_gp = total_value - total_value_cp;
        $('.total-value-of-inventory-gp')
        .html( appCurrency + formatNum(total_value_gp.toFixed(2) ) );
        
        $('.total-value-of-inventory-sp')
        .html( appCurrency + formatNum(total_value.toFixed(2) ) );
        
        $('.total-value-of-inventory-cp')
        .html( appCurrency + formatNum(total_value_cp.toFixed(2) ) );
        
        $('.total-items-in-stock')
        .html( formatNum( total_items ) );
        
        $('.total-unique-items')
        .html( formatNum( i ) );
    }
    
    if( show_error && error_html ){
        var settings = {
            message_title:'Negative Stock Index',
            message_message: 'Please contact the Blubird Support Center '+error_html,
            auto_close: 'yes'
        };
        display_popup_notice( settings );
    }
};

function activate_update_of_current_store( $page ){
    $page
    .find('select.currently-active-store')
    .not('.skip-change-event')
    .on('change', function(){
        if( $(this).val() ){
            currentStoreID = $(this).val();
            
            //refresh page
            $page
            .trigger("pageshow");
        }
    });
};

function get_inventory_level_html( value , i ){
	
	var units = parseFloat( value.item_qty ) - parseFloat( value.item_sold );
	var stclass = 'stcklvl';
	
	if( units < appLowStockLevel ){
		var stclass = 'stcklow';
	}
	return '<div class="sort-element ui-block-c" stock="'+units+'"><div class="ui-bar ui-bar-a" style="height:65px;">'+value.item_desc+'<span class="'+stclass+'">' + units +'</span></div></div>';
};

$( document ).on( "pageshow", "#restock", function() {
	
	//Update inventory list
	var inventory = get_list_of_inventory();
	var html = selectItemOption;
	$.each( inventory , function( key , value ){
        if( value && value.item_barcode && value.category ){
            html += '<option value="'+key+'" class="'+value.category+'">'+value.item_desc+' ['+value.item_barcode+']</option>';
        }
	});
	
	if( html ){
		$('#stock-form')
		.find('select[name="item_barcode"]')
		.html( html )
        .find('option')
        .tsort();
        
        if( ! $allItemSelectBox ){
            $allItemSelectBox = $('#stock-form').find('select[name="item_barcode"]').clone();
        }
	}
	
	populate_category_select_box( $('#restock').find('#filter-category-field') );
	populate_suppliers_select_box( $('#stock-form').find('select[name="supplier"]') );
    populate_stores_select_box( $('#stock-form').find('select.currently-active-store') );
    
    $('#recently-stocked-items').html('');
});

$( document ).on( "pageshow", "#damages", function() {
	
	//Update inventory list
    populate_category_select_box( $('#damages').find('#filter-category-field') );
    populate_stores_select_box( $('#damages-form').find('select.currently-active-store') );
    
    var inventory = get_list_of_inventory();
    display_table_on_inventory_page( inventory, $('tbody#damages-list-container') , $('#damages') , 0 , 0 , 1, 0 );
    
    $("#damages")
    .find('select[name="item_barcode"]')
    .html( $itemSelectBox.html() )
    .val('')
    .selectmenu('refresh');
});

$( document ).on( "pageshow", "#transferStock", function() {
	
	//Update inventory list
	var inventory = get_list_of_inventory();
	var html = '<option value="">-- Select Item --</option>';
	$.each( inventory , function( key , value ){
		html += '<option value="'+key+'" class="'+value.category+'">'+value.item_desc+'</option>';
	});
	
	if( html ){
		$('#transferstock-form')
		.find('select[name="item_barcode"]')
		.html( html );
	}
	
	populate_category_select_box( $('#transferstock-form').find('#filter-category-field') );
    populate_stores_select_box( $('#transferstock-form').find('select.currently-active-store') );
    
});

var add_vat_to_sale = appVATValue;
var salesData = {};
var connectedDevice = false;
var bluetoothDevice = true;
var desktopPrinter = false;

$( document ).on( "pagecreate", "#checkout", function() {
	test_for_active_user();
    
    //registered
    $('#checkout-payment-method')
    .on( 'change', function(){
        salesData.payment_method = $(this).val();
    });
    
    $('#confirm-this-sale-button')
    .on( 'click', function(){
        
        //check for customers details
        var allow_credit_sale = false;
        var customers = true;
        var customers_data = {};
        if( $('#customer_mobile-field') && $('#customer_mobile-field').val() ){
            var name = 'Anonymous';
            if( $('#customer_name-field').val() ){
                name = $('#customer_name-field').val();
            }
            
            var ckey = 'c' + customUUID + $('#customer_mobile-field').val();
            
            customers_data = {
                'key':ckey,
                'customer_name':name,
                'customer_mobile':$('#customer_mobile-field').val(),
                'customer_email':'',
                'payments':{},
                'sale':{},
                'object':'customers',
            };
            
            allow_credit_sale = true;
        }else{
            if( $('#customer_name-field') && $('#customer_name-field').val() ){
                customers = false;
            }
        }
        
        if( customers ){
            var amount_paid = parseFloat( $('#amount_tendered-field').val() );
            var change = amount_paid -  parseFloat( salesData.total_amount );
            
            if( ( change + 0.0001 ) > 0 ){
                allow_credit_sale = true;
            }
            
            if( allow_credit_sale ){
                salesData.total_amount_tendered = amount_paid;
                
                if( customers_data && customers_data.key ){
                    salesData.customer = customers_data.key;
                }
                
                var stored = store_record( salesData );
                successful_submit_action( stored );
                
                //check for existing customers data
                if( customers_data && customers_data.key && Object.getOwnPropertyNames( customers_data ).length ){
                    
                    var c = getData( customers_data.key );
                    if( c && c.sale ){
                        c.sale[ stored.key ] = stored.key;
                        customers_data.sale = c.sale;
                    }else{
                        customers_data.sale[ stored.key ] = stored.key;
                    }
                    
                    var stored_cus = store_record( customers_data );
                    successful_submit_action( stored_cus );
                }
                salesData = {};
                
                $('#this-sale-change').html('0.00');
                if( $('#customer_name-field') ){
                    $('#customer_name-field').val('');
                    $('#customer_mobile-field').val('');
                }
                
                //print receipt
                if( desktopPrinter ){
                    msg = formatReceiptHTML( stored );
                    var x=window.open();
                    x.document.open();
                    x.document.write( '<link href="'+ $('#print-css').attr('href') +'" rel="stylesheet" /><style ="text/css">body{font-size:12px;}</style><script type="text/javascript"> window.onload=function(){ window.print(); setTimeout(function(){ window.close(); }, 300 ); };</script>' + '<body style="padding:0;">' + msg + '</body>' );
                    //x.document.write( '<link href="'+ $('#print-css').attr('href') +'" rel="stylesheet" /><script type="text/javascript">setTimeout( function(){ window.print(); window.onfocus=function(){ window.close();} }, 400 );</script>' + '<body style="padding:0;">' + msg + '</body>' );
                    x.document.close();
                }else{
                    msg = formatReceiptText( stored );
                    var message = msg +''+ msg;
                    if( connectedDevice && bluetoothSerial ){
                        bluetoothSerial.write( message , function(){
                            //success
                        } );
                    }
                }
                
                $.mobile.navigate( "#sales", { transition : "none" });
            }else{
                if( allow_credit_sale ){
                    var settings = {
                        message_title:'Invalid Amount',
                        message_message: 'Please enter the amount tendered',
                        auto_close: 'yes'
                    };
                    display_popup_notice( settings );
                }else{
                    var settings = {
                        message_title:'Credit Sale',
                        message_message: 'Please enter the customer\'s details',
                        auto_close: 'yes'
                    };
                    display_popup_notice( settings );
                    if( $('#customer_name-field') ){
                        $('#customer_name-field').focus();
                    }
                }
            }
        }else{
            var settings = {
                message_title:'Invalid Field',
                message_message: 'Please enter the customer\'s mobile number',
                auto_close: 'yes'
            };
            display_popup_notice( settings );
            if( $('#customer_mobile-field') ){
                $('#customer_mobile-field').focus();
            }
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
	
    $("select#bluetooth-devices-selectbox")
    .on( 'change' , function(){
        var device = $(this).val();
        
        desktopPrinter = false;
        if( device == 'desktop' ){
            desktopPrinter = true;
            return false;
        }
        
        //disconnect
        if( connectedDevice && bluetoothSerial ){
            $('#statusMessage')
            .html( "Disconnecting..." );
            
            bluetoothSerial.disconnect( disconnectedDevice );
            connectedDevice = false;
        }
        
        if( bluetoothSerial ){
            if( device ){
                //connect
                $('#statusMessage')
                .html( "Connecting..." );
                
                bluetoothSerial.connect(device, function(){
                    $('#statusMessage')
                    .html( "Connected" );
                    
                    connectedDevice = true;
                }, disconnectedDevice );
            }
        }
    });
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
				
				html += '<tr><td class="label">'+val.item_desc+'</td><td class="ui-table-priority-2">'+val.unit_ordered+'</td><td class="ui-table-priority-3">' + formatNum( up.toFixed(2) ) + '</td><td class="ui-table-priority-1">' + formatNum( amount.toFixed(2) ) + '</td></tr>';
			});
			
			var v = salesData.vat;
			$('#checkout-vat')
			.text( formatNum( v.toFixed(2) ) );
			
			var d = salesData.discount;
			$('#checkout-discount')
			.text( formatNum( d.toFixed(2) ) );
			
			//queueUpload( upload );
			salesData.payment_method = $('#checkout-payment-method').val();
			
            var t = salesData.total_amount_tendered;
			$('#amount_tendered-field').val( t.toFixed(2) );
			
			var a = salesData.total_amount;
			$('#this-sale-total-amount')
			.val( formatNum( a.toFixed(2) ) );
			
			$('#this-sale-checkout-total').html( formatNum( a ) );
		}
	}
	
	if( ! html ){
		html = '<tr><td colspan="4" style="text-align:center;">Empty Cart</td></tr>';
	}
	
    if( ! connectedDevice ){
        $('#statusMessage')
        .html( $('#statusMessage').attr('data-disconnected') );
        
        //get list of bluetooth devices
        if( typeof( bluetoothSerial ) !== 'undefined' ){
            bluetoothSerial.list( gotListOfBluetoothDevices , function(){
                var settings = {
                    message_title:'Bluetooth Error',
                    message_message: 'Could not get list of devices',
                    auto_close: 'yes'
                };
                display_popup_notice( settings );
            } );
        }else{
            if( bluetoothDevice ){
                bluetoothDevice = false;
                
                if( ! blubirdWebbased ){
                    //return error
                    var settings = {
                        message_title:'Bluetooth Error',
                        message_message: 'Plugin failed to initialize',
                        auto_close: 'yes'
                    };
                    display_popup_notice( settings );
                }
            }
        }  
    }
    
	$('tbody#checkout-table-body')
	.html( html );
	
});

function disconnectedDevice(){
    $('#statusMessage')
    .html( "Disconnected" );
}

function gotListOfBluetoothDevices( devices ){
   var option = '<option value="">--Select Device--</option><option value="desktop">Regular PC Printer</option>';
   var error = '';
    
    devices.forEach(function(device) {
        var value = '';
        if (device.hasOwnProperty("uuid")) {
            value = device.uuid;
        } else if (device.hasOwnProperty("address")) {
            value = device.address;
        } else {
            error += "ERROR " + JSON.stringify(device);
        }
        if( value ){
            option += '<option value="'+value+'">'+device.name+'</option>';
        }
    });

    if (devices.length === 0) {
        
        option = '<option value="">--No Bluetooth Devices--</option>';
        
        if (cordova.platformId === "ios") { // BLE
            $('#statusMessage')
            .html( "No Bluetooth Peripherals Discovered." );
        } else { // Android
            $('#statusMessage')
            .html( "Please Pair a Bluetooth Device." );
        }

    } else {
        $('#statusMessage')
        .html( "Found " + devices.length + " device" + (devices.length === 1 ? "." : "s.") );
    } 
    
    if( error ){
        alert(error);
    }
    
    if( option ){
        $("select#bluetooth-devices-selectbox")
        .html( option )
        .selectmenu("refresh");
    }
};

var salesInventory = {};
var salesInventoryOriginal = {};
var salesDebounceTimeout;
$( document ).on( "pagecreate", "#sales", function() {
	test_for_active_user();
	//activate_upload_queue_button();
	activate_update_of_current_store( $("#sales") );
    
    activate_panel_navigation( $("#sales") );
    
    activate_manual_upload_data_button_click_event( $("#sales") );
    
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
	
    $('a.button-scan')
	.on('click', function(){
		cordova.plugins.barcodeScanner.scan(
		  function (result) {
			$("#sales")
            .find('#sales-inventory-list-container')
            .find('input')
			.val( prefixZeroBarcodes( result.text ) )
            .blur();
		  }, 
		  function (error) {
			  alert("Scanning failed: " + error);
		  }
	   );
	});
    
    $( "#sales-inventory-list-filter-form" )
    .on('submit', function(e){
        e.preventDefault();
    });
    
    $( "#sales-inventory-list-filter" )
    .on( "keyup", function () {
        if( salesDebounceTimeout )clearTimeout( salesDebounceTimeout );
        salesDebounceTimeout = setTimeout( debounceSales, 200 );
    })
    .on('keypress', function(){ $( this ).keyup(); });
    
    $('#sales-inventory-list-container')
    .find('input')
    .on('keydown', function(){
        salesInventory = {};
    });
    
});

function debounceSales(){
    if( salesDebounceTimeout )clearTimeout( salesDebounceTimeout );
    
    var $ul = $('#sales-inventory-list'),
    
    $input = $( "#sales-inventory-list-filter" ),
    v = $input.val(),
    html = "";
    
    if( v.length > 5 ){
        d = getData( customUUID +''+ prefixZeroBarcodes( v ) );
        if( d && d.key ){
            //add item to cart
            addtocart( d.key );
            
            $input.val('');
            return false;
        }
    }
    
    if ( v && v.length > 1 ) {
        //Update inventory list
        var last_v = '';
        if( $(this).data('last') )
            last_v = $(this).data('last');
            
        $(this).data('last', v );
        
        if( ( ! ( salesInventory && Object.getOwnPropertyNames(salesInventory).length ) ) || last_v.length > $(this).data('last').length  ){
            salesInventory = $.extend(true, {}, get_list_of_inventory() );
        }
        var html = '';
        
        if( currentStoreID ){
            $.each( salesInventory , function( key , value ){
                if( ( value && value.store && value.store[ currentStoreID ] ) || ( value.item_stock_type && value.item_stock_type == 'on' ) ){
                    //test regular exp
                    
                    var t = new RegExp(v, "i");
                    var vl = '';
                    if( value.item_desc )vl = value.item_desc;
                    
                    if( ! ( t.test(vl) ) ){
                        delete salesInventory[key];
                        return;
                    }
                    
                    value.key = key;
                    html += get_sales_html_of_items( value );
                }
            });
        }
        
        $ul.html( html );
        $ul.listview( "refresh" );
        $ul.trigger( "updatelayout");
        
        if( html ){
            $('#sales-inventory-list')
            .find('a')
            .on('click', function(e){
                e.preventDefault();
                addtocart( $(this).attr('key') );
            });
        }
    }else{
        salesInventory = $.extend(true, {}, get_list_of_inventory() );
        
        switch( appSettings.app_mode ){
        case 'retail':
        break;
        case 'restaurant':
            $ul.html( '' );
        break;
        }
    }
};

function get_sales_html_of_items( value ){
    
    if( ! ( value.item_stock_type && value.item_stock_type == 'on' ) ){
        var storeStock = value.store[ currentStoreID ];
        if( ! storeStock.item_sold )storeStock.item_sold = 0;
        if( ! storeStock.item_damaged )storeStock.item_damaged = 0;
        
        value.item_qty = storeStock.item_qty;
        value.item_sold = storeStock.item_sold;
        value.selling_price = storeStock.selling_price;
        value.cost_price = storeStock.cost_price;
        value.item_damaged = storeStock.item_damaged;
    }
    var qty = 0;
    if(  value.item_qty )qty = parseFloat( value.item_qty );
    if(  value.item_sold )qty = qty - parseFloat( value.item_sold );
    if(  value.item_damaged )qty = qty - parseFloat( value.item_damaged );
    
    if( value.item_stock_type && value.item_stock_type == 'on' ){
        qty = 1;
        value.cost_price = 0;
    }
    
    if( qty > 0 ){
        var img = 'icon.png';
        if( blubirdFileURL ){
            img = blubirdFileURL + value.item_image;
        }
        if( value.image && value.item_image == value.image )
            img = 'imagebank/' + value.item_image;
        
        if( blubirdWebbased ){
            img = 'imagebank/'+value.item_image;
        }
        
        return '<li><a href="#" id="item-link-'+value.key+'" key="'+value.key+'" max-qty="'+qty+'" selling-price="'+value.selling_price+'" cost-price="'+value.cost_price+'"><img src="' + img + '" class="ui-li-thumb" /><p>'+value.item_desc+'<span style="font-size:0.9em;"><br />('+value.item_barcode+')<span></p></a></li>';
    }
    return '';
};

$( document ).on( "pageshow", "#sales", function() {
	activate_menu();
    
    populate_stores_select_box( $('#sales').find('select.currently-active-store') );
    
    check_for_data_to_upload( $('#sales') );
    
    add_vat_to_sale = appVATValue;
    
    var category_html = '';
    
    switch( appSettings.app_mode ){
    case 'retail':
        $('#sales-categories-container')
        .html(category_html);
    break;
    case 'restaurant':
        //display categories
        category_html = '';
        var categories = get_list_of_category();
        $.each( categories , function( key , value ){
            category_html += '<li><a href="#" id="category-link-'+key+'" key="'+key+'"><p>'+value.category+'</p></a></li>';
        });
        
        $('#sales-categories-container')
        .html(category_html)
        .listview( "refresh" )
        .trigger( "updatelayout");
        
        $('#sales-categories-container')
        .find('a')
        .on('click', function(e){
            e.preventDefault();
            
            var html = '';
            if( currentStoreID ){
                
                var c2 = $(this).attr('key');
                var i = get_list_of_inventory()
                
                $.each( i , function( key , value ){
                    if( value && value.category && value.category == c2 ){
                        if( ( value.key && value.store && value.store[ currentStoreID ] ) || ( value.item_stock_type && value.item_stock_type == 'on' ) ){
                            html += get_sales_html_of_items( value );
                        }
                    }
                });
            }
            
            if( html ){
                html = '<li><a href="#" class="back"><img src="back.png" class="ui-li-thumb" /><p>Back</p></a></li>' + html;
            }
            
            $( "#sales-inventory-list" )
            .html( html );
            
            if( html ){
                $( "#sales-inventory-list" )
                .listview( "refresh" )
                .trigger( "updatelayout");
                
                $('#sales-inventory-list')
                .find('a')
                .on('click', function(e){
                    e.preventDefault();
                    
                    if( $(this).hasClass('back') ){
                        $('#sales-inventory-list')
                        .html('');
                        return false;
                    }
                    
                    addtocart( $(this).attr('key') );
                });
            }
        });
    break;
    }
    
    switch( appDiscountType ){
    case 'percentage':
        $('#sales')
        .find('#percentage-discount')
        .attr('placeholder', '%' );
    break;
    case 'fixed_amount':
        $('#sales')
        .find('#percentage-discount')
        .attr('placeholder', 'Discounted Amount' );
    break;
    }
    
});

var cartTimerID;
function addtocart( key ){
    var qty = 0;
    
    if( key ){
        d = getData( key );
        
        if( ! ( d.item_stock_type && d.item_stock_type == 'on' ) ){
            var storeStock = d.store[ currentStoreID ];
            if( ! storeStock.item_sold )storeStock.item_sold = 0;
            if( ! storeStock.item_damaged )storeStock.item_damaged = 0;
            
            d.item_qty = storeStock.item_qty;
            d.item_sold = storeStock.item_sold;
            d.selling_price = storeStock.selling_price;
            d.cost_price = storeStock.cost_price;
            d.item_damaged = storeStock.item_damaged;
        }
        if( d.item_qty )qty = parseFloat( d.item_qty );
        if( d.item_sold )qty = qty - parseFloat( d.item_sold );
        if( d.item_damaged )qty = qty - parseFloat( d.item_damaged );
        
    }        
    
    if( ! ( d && d.key ) )return false;
    
    if( d.item_stock_type && d.item_stock_type == 'on' ){
        qty = 1;
    }
    
    if( ! ( qty > 0 ) ){
        return false;
    }
    
    var amount = parseFloat( d.selling_price );
    var cost = parseFloat( d.cost_price );
    var $item = $('#sales-table-body').find('tr#'+md5(d.key) );
    
    var units = 0;
        
    if( $item && $item.is(':visible') ){
        var $input = $item.find( 'input' );
        if( $input.attr('infinity') && $input.attr('infinity') == 'on' ){
            $input.attr('max', $input.val()*2 );
        }
        
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
        var infinity = '';
        if( d.item_stock_type && d.item_stock_type == 'on' ){
            infinity = 'on';
        }
        
        $('#sales-table-body')
        .prepend( '<tr id="'+md5(d.key)+'" key="'+d.key+'" unit-price="'+amount+'" cost-price="'+cost+'" class="item-for-sale"><td class="label">'+d.item_desc+'<br /><span style="font-size:0.8em;">'+d.item_barcode+'</span></td><td class="input"><input type="number" min="1" step="1" infinity="'+infinity+'" max="'+qty+'" value="1" /></td><td class="price" total="'+amount+'" units="1"><span class="price-val">' + formatNum( amount.toFixed(2) ) + '</span></td><td class="ui-table-priority-2"><a href="#" class="ui-btn ui-btn-inline ui-icon-delete ui-btn-icon-notext ui-theme-a ui-corner-all remove-item-button">remove</a></td></tr>' );
        
        $('#sales-table-body')
        .find('tr#'+md5(d.key)+' input[type="number"]' )
        .off('change');
        
        $('#sales-table-body')
        .find('tr#'+md5(d.key)+' input[type="number"]' )
        .on('change', function(){
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
            if( $(this).attr('infinity') && $(this).attr('infinity') == 'on' ){
                $(this).attr('max', $(this).val()*2 );
            }
            
            if( $(this).attr('max') && ( parseFloat( $(this).val() ) > parseFloat( $(this).attr('max') ) ) ){
                $(this)
                .val( $(this).attr('max') );
                
                $(this).change();
            }
            
            if( ( parseFloat( $(this).val() ) < 1 ) ){
                $(this)
                .val(1);
                
                $(this).change();
            }
        });
        
        $('#sales-table-body')
        .find('tr a.remove-item-button' )
        .off('click');
        
        $('#sales-table-body')
        .find('tr a.remove-item-button' )
        .on('click', function(){
            $(this).parents('tr').remove();
            calculate_total_sales();
        });
        
        $('#sales-table-body')
        .find('td.label' )
        .off('click');
        
        $('#sales-table-body')
        .find('td.label' )
        .on('click', function(){
            //$('a#item-link-'+$(this).parent('tr').attr('id')).click();
            var $n = $(this).parents('tr').find('input[type="number"]');
            var u = parseFloat( $n.val() );
            var m = parseFloat( $n.attr('max') );
            
            if( ++u < m ){
                $n.val( u ).change();
            }
        });
        
        units = 1;
    }
    
    if( cartTimerID ){
        clearTimeout( cartTimerID );
    }
    
    if( units ){
        $('#popupSales-text')
        .html('+ '+d.item_desc);
        
        $('#popupSales')
        .slideDown();
        cartTimerID = setTimeout( function(){ $('#popupSales').slideUp(); }, 1000 );
        
        calculate_total_sales();
    }else{
        $('#popupSales-text')
        .html('<span style="color:red;">**OUT OF STOCK**<br />'+d.item_desc+'</span>');
        
        $('#popupSales')
        .slideDown();
        cartTimerID = setTimeout( function(){ $('#popupSales').slideUp(); }, 1000 );
    }
};
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
			var key = $(this).attr('key');
			items[ key ] = {
				key: key,
				item_desc: $(this).find('td.label').html(),
				unit_selling_price: parseFloat( $(this).attr('unit-price') ),
				unit_cost_price: parseFloat( $(this).attr('cost-price') ),
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
		
		add_discount_to_sale = $('#percentage-discount').val()*1;
		
		var discount = 0;
		if( total ){
            switch( appDiscountType ){
            case 'fixed_amount':
                discount = parseFloat( add_discount_to_sale );
            break;
            default:
                discount = total * add_discount_to_sale / 100;
            break;
            }
            
			var dt = total;
			$('#this-sale-total-amount-discount')
			.html( formatNum( discount.toFixed(2) ) );
			
			total -=  discount;
		}else{
			$('#this-sale-total-amount-discount')
			.html( '0.00' );
		}
		
		if( total_units ){
			salesData = {
				object: 'sales',
				error: false,
				store_name: currentStoreID,
				inventory: items,
				total_amount: total,
				vat: vat,
				discount: discount,
				subtotal: total_price,
				total_units: total_units,
				total_cost_price: total_cost_price,
				total_amount_tendered: total,
				payment_method: '',
				customer: '',
			};
		}
		
		$('#this-sale-total-amount')
		.html( formatNum( total.toFixed(2) ) );
		
	}
};

$( document ).on( "pagecreate", "#my-profile", function() {
	test_for_active_user();
	handle_form_submission( $('form#app_users-form') );	
});

$( document ).on( "pageshow", "#my-profile", function() {
	
    var userInfo = get_user_info();
    if( userInfo && Object.getOwnPropertyNames(userInfo).length ){
        $.each( userInfo , function(key , value ){
            switch( key ){
            case 'error': case 'object': case 'password': case 'cpassword': case 'cemail':
            break;
            default:
                $('form#app_users-form')
                .find('#'+key+'-field')
                .val( value );
            break;
            }
        });
    }
    
    $('form#generalsettings-form')
    .find('#id-field')
    .val( customUUID );
});

$( document ).on( "pagecreate", "#update-progress", function() {
	test_for_active_user();
    $('#go-to-dashboard')
    .on('click', function(e){
        e.preventDefault();
        document.location = document.location.origin + document.location.pathname + document.location.search;
    });
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
        
        var itemsToGetImages = {};
        
		$.each( tempData , function( object , key ){
			var count = 0;
			var obj = getData( object );
			if( ! obj )obj = {};
			
			if( key ){
				$.each( key , function( k , v ){
					if( k ){
						putData( k , v );
						obj[ k ] = k;
						
						//prepare inventory to download images
						if( object == 'inventory' ){
                            if( v && v.item_image ){
                                itemsToGetImages[ k ] = v.item_image;
                            }
                        }
                        
						++count;
					}
				});
				
				putData( object , obj );
				
				switch( object ){
                case 'inventory':
                    //queue images for download
                    var pendingImages = getData( downloadImageKey );
                    if( ! pendingImages )pendingImages = {};
                    $.each( itemsToGetImages , function( k , v ){
                        pendingImages[k] = v;
                    });
                    putData( downloadImageKey , pendingImages );
                break;
				}
				
                if( $('#update-progress-area') && $('#update-progress-area').is(':visible') ){
                    $('#update-progress-area')
                    .prepend('<li>Download Complete - '+object.replace( '_' , ' ' )+' <span>'+count+' entries</span></li>');
				}
                
				i = object;
			}
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

function update_and_re_trigger_data_download_after_upload( tempData ){
	if( tempData && Object.getOwnPropertyNames( tempData ).length ){
		var i = '';
        
        var itemsToGetImages = {};
        
		$.each( tempData , function( object , key ){
			 
            active_page = get_active_page_id();
            switch( active_page ){
            case 'dashboard':
            case 'inventory':
            case 'sales':
            case 'settings':
                var $title = $( '#'+active_page ).find('h1:first');
                
                if( ! $title.hasClass('uploading-data-title') ){
                    $title
                    .addClass('uploading-data-title')
                    .attr( 'default-text' , $title.html() )
                    .html( '<span>( '+object+' ) Downloading from Server...</span>' );
                }
            break;
            }
            
            var count = 0;
			var obj = getData( object );
			if( ! obj )obj = {};
			
			if( key ){
				$.each( key , function( k , v ){
					if( k ){
						putData( k , v );
						obj[ k ] = k;
						
						//prepare inventory to download images
						if( object == 'inventory' ){
                            if( v && v.item_image ){
                                itemsToGetImages[ k ] = v.item_image;
                            }
                        }
                        
                        switch( object ){
                        case 'sales':
                        case 'damages':
                        case 'expenses':
                        case 'supply':
                            add_to_daily_cache( v );
                            //if( ! storeObjects[ object ] )storeObjects[ object ] = {};
                            //storeObjects[ object ][ k ] = v;
                        break;
                        case 'inventory':
                            //if( ! storeObjects[ 'inventory_list' ] )storeObjects[ 'inventory_list' ] = {};
                            //storeObjects[ 'inventory_list' ][ k ] = v;
                        break;
                        }
                        
						++count;
					}
				});
				
				putData( object , obj );
				
				switch( object ){
                case 'inventory':
                    //queue images for download
                    var pendingImages = getData( downloadImageKey );
                    if( ! pendingImages )pendingImages = {};
                    $.each( itemsToGetImages , function( k , v ){
                        pendingImages[k] = v;
                    });
                    putData( downloadImageKey , pendingImages );
                break;
				}
				
                if( $('#update-progress-area') && $('#update-progress-area').is(':visible') ){
                    $('#update-progress-area')
                    .prepend('<li>Download Complete - '+object.replace( '_' , ' ' )+' <span>'+count+' entries</span></li>');
				}
                
				i = object;
			}
		});
		
		if( i ){
            storeObjects = {};
            
			//place next request
			ajax_data = { app_uid: customUUID };
			form_method = 'post';
			ajax_data_type = 'json';
			ajax_action = 'request_function_output';
			ajax_container = $('#login-form');
			ajax_get_url = '?action=data_transfer&todo=download_data_after_upload';
			ajax_send();
		}
	}
};

function prepare_notifications_for_display( type ){
    //check for unread notifications
    var notifications = getData( 'notifications' );
    var count = 0;
    var notifications_short_html = '';
    var notifications_data = {};
    
    if( notifications && Object.getOwnPropertyNames( notifications ).length ){
        $.each( notifications , function( k , kk ){
            var v = getData(k);
            if( v && v.title ){
                if( ! v.day ){
                    var date = new Date(v.creationtimestamp);
                    // hours part from the timestamp
                    var calendar_day = date.getDate();
                    var month = date.getMonth();
                    var year = date.getFullYear();
                    var day = year+'_'+months_of_year[ month ]+'_'+calendar_day;
                    var minutes = date.getMinutes();
                    
                    if( minutes < 10 )minutes = '0'+minutes;
                    var time = date.getHours() + ':' + minutes;
                    
                    v.date = weekdays[ date.getDay() ]+', '+months_of_year[ month ]+' '+calendar_day+', '+year;
                    v.day = day;
                    v.time = time;
                }
                
                if( ! notifications_data[ v.day ] ){
                    notifications_data[ v.day ] = {
                        html: '',
                        date: v.date,
                        count: 0,
                        notification_keys: k,
                    };
                }
                    
                notifications_data[ v.day ].html = get_notifications_html( v ) + notifications_data[ v.day ].html;
                notifications_data[ v.day ].count += 1;
                notifications_data[ v.day ].notification_keys += ':::'+k;
                    
                if( type == 0 && ! ( v.read ) ){
                    notifications_short_html = get_notifications_short_html( v ) + notifications_short_html;
                    ++count;
                }
                
                if( type && ! ( v.read ) ){
                    v.read = 1;
                    putData( k , v );
                }
            }
        } );
    }
    
    unreadNotificationsCount += count;
    var notifications_html = '';
    if( notifications_data ){
        $.each( notifications_data , function( k , v ){
            //notifications_html = '<li data-role="list-divider" role="heading" class="'+k+' ui-li-divider ui-bar-inherit ui-li-has-count ui-first-child">'+v.date+' <span class="ui-li-count-count ui-body-inherit">'+v.count+'</span> <a href="#" class="clear-notifications ui-li-count ui-body-inherit" title="Clear All" default-text="X" day-class="'+k+'" keys="'+v.notification_keys+'">X</a></li>' + v.html + notifications_html;
            
            notifications_html = '<div data-role="collapsible" data-theme="b" data-content-theme="a" data-inset="false" class="'+k+'"><h5 style="font-weight: 100 !important;">'+v.date+'<span style="float: right; ">'+v.count+'</span></h5><div><ul class="ui-listview ui-listview-inset ui-corner-all ui-shadow">' + v.html + '</ul></div></div><!-- /collapsible -->' + notifications_html;
        });
        
        if( notifications_html ){
            $('#notifications-container')
            .html( notifications_html );
            
            $('#notifications-container')
            .find('a.clear-notifications')
            .on('click', function( e ){
                e.preventDefault();
                
                if( $(this).text() == $(this).attr('title') && $(this).attr('keys') ){
                    var keys = $(this).attr('keys').split(':::');
                    if( keys && keys.length > 0 ){
                        notifications = getData( 'notifications' );
                        
                        $.each( keys , function( n , key ){
                            clearSingleData( key );
                            if( notifications[ key ] )
                                delete notifications[ key ];
                        });
                        
                        putData( 'notifications' , notifications );
                        
                        $('#notifications-container')
                        .find('.'+$(this).attr('day-class'))
                        .remove();
                    }
                }
                
                if( $(this).text() == $(this).attr('default-text') ){
                    $(this)
                    .text( $(this).attr('title') );
                }
            });
        }
    }
    
    if( type ){
        $('h1.notifications-title')
        .each( function(){
            $(this).html( $(this).attr('default-title') );
        });
    }else{
        if( notifications_short_html ){
            //$('h1.notifications-title.notifications-count-with-notifications')
            $('h1.notifications-title')
            .html( '<a href="#notifications" data-transition="none"><marquee class="rbto-1 notifications-count-with-notifications" behavior="scroll" scrollamount="3" direction="left" >You\'ve '+unreadNotificationsCount+' new notifications'+notifications_short_html + '</marquee></a>' );
        }
    }
    
};

function get_notifications_html( n ){
	return '<li class="'+n.day+' notifications-detailed-message-container" timestamp="'+n.creationtimestamp+'"><h4>'+n.title+'</h4><p>'+n.detailed_message+'</p><p class="ui-li-aside"><strong>'+n.time+'</strong></p></li>';
};

function get_notifications_short_html( n ){
	if( n.subtitle )
        return ' &nbsp;&nbsp;|&nbsp;&nbsp; '+n.subtitle;
};

function activate_record_delete_button( page_id ){
    $(page_id)
	.find('.delete-record')
	.on('click', function(e){
		e.preventDefault();
		if( $(this).attr('key') && $(this).attr('object') ){
			var key = $(this).attr('key');
			var object = $(this).attr('object');
			
			var r = confirm('Do you want to delete the selected record');
			if( r == true ){
				var settings = {
                    message_title:'Successful Delete',
                    message_message: '',
                    auto_close: 'yes'
                };
                
                switch( object ){
                case 'category':
                case 'users':
                    $('#'+key)
                    .remove();
                    
                    $('option[value="'+key+'"]')
                    .remove();
                    
                    $('form#'+object+'-form')
                    .find('input')
                    .val('');
                break;
                case 'sales':
                    var data = getData( key );
                    if( data && data.key ){
                        //restock inventory
                        $.each( data.inventory , function( k , v ){
                            var inventory = getData( k );
                            if( data.store_name && inventory && inventory.store && inventory.store[ data.store_name ] ){
                                var tmp_store_data = inventory.store[ data.store_name ];
                                
                                if( tmp_store_data.sales ){
                                    delete tmp_store_data.sales[ key ];
                                }
                                
                                if( tmp_store_data.item_sold ){
                                    tmp_store_data.item_sold -= parseFloat( v.unit_ordered );
                                    tmp_store_data.income -= (parseFloat(v.unit_ordered) * parseFloat( v.unit_selling_price ));
                                }else{
                                    tmp_store_data.item_sold = 0;
                                    tmp_store_data.income = 0;
                                }
                                
                                inventory.store[ data.store_name ] = tmp_store_data;
                                putData( k , inventory );
                                if( ! storeObjects[ 'inventory_list' ] )storeObjects[ 'inventory_list' ] = {};
                                storeObjects[ 'inventory_list' ][ k ] = inventory;
                            }
                        });
                        //hours part from the timestamp
                        if( data.timestamp ){
                            var date = new Date( data.timestamp );
                            var day = date.getDate();
                            var month = date.getMonth();
                            var year = date.getFullYear();
                            
                            if( day < 10 )day = '0'+day;
                            if( month < 10 )month = '0'+month;
                            var cache_key = object + year + '-' + month + '-' + day;
                            
                            var cache = getData( cache_key );
                            if( cache && cache[ key ] )
                                delete cache[ key ];
                                
                            putData( cache_key , cache );
                        }
                    }
                    $('#container-'+key).remove();
                    settings.message_message = 'Sales record have been successfully deleted and items re-stocked';
                break;
                case 'damages':
                    var data = getData( key );
                    if( data && data.key ){
                        var inventory = getData( data.item_barcode );
                        if( inventory && inventory.store && inventory.store[data.store_name] ){
                            var tmp_store_data = inventory.store[ data.store_name ];
                            
                            if( tmp_store_data && tmp_store_data.damages ){
                                delete tmp_store_data.damages[ key ];
                            }
                            
                            if( tmp_store_data.item_damaged ){
                                tmp_store_data.item_damaged -= parseFloat( data.damage_qty );
                            }else{
                                tmp_store_data.item_damaged = 0;
                            }
                            
                            inventory.store[ data.store_name ] = tmp_store_data;
                            putData( data.item_barcode , inventory );
                            storeObjects[ 'inventory_list' ][ data.item_barcode ] = inventory;
                        }
                        //hours part from the timestamp
                        if( data.timestamp ){
                            var date = new Date( data.timestamp );
                            var day = date.getDate();
                            var month = date.getMonth();
                            var year = date.getFullYear();
                            
                            if( day < 10 )day = '0'+day;
                            if( month < 10 )month = '0'+month;
                            var cache_key = object + year + '-' + month + '-' + day;
                            
                            var cache = getData( cache_key );
                            if( cache && cache[ key ] )
                                delete cache[ key ];
                                
                            putData( cache_key , cache );
                        }
                        
                        if( storeObjects && storeObjects[ 'damages_list' ] && storeObjects[ 'damages_list' ][ data.key ] )
                            delete storeObjects[ 'damages_list' ][ data.key ];
                            
                        $('#damages')
                        .find( 'tbody#damages-list-container' )
                        .find('#'+data.key)
                        .remove();
                    }
                    $('#container-'+key).remove();
                    settings.message_message = 'The record have been successfully deleted';
                break;
                case 'expenses':
                    var data = getData( key );
                    if( data && data.key ){
                        //hours part from the timestamp
                        if( data.timestamp ){
                            var date = new Date( data.timestamp );
                            var day = date.getDate();
                            var month = date.getMonth();
                            var year = date.getFullYear();
                            
                            if( day < 10 )day = '0'+day;
                            if( month < 10 )month = '0'+month;
                            var cache_key = object + year + '-' + month + '-' + day;
                            
                            var cache = getData( cache_key );
                            if( cache && cache[ key ] )
                                delete cache[ key ];
                                
                            putData( cache_key , cache );
                        }
                    }
                    $('#container-'+key).remove();
                    settings.message_message = 'The record have been successfully deleted';
                break;
                case 'supply':
                    var data = getData( key );
                    if( ( ! data.store_name ) && data.store_id )data.store_name = data.store_id;
                    
                    if( data && data.key && data.stock ){
                        //restock inventory
                        $.each( data.stock , function( k , v ){
                            var stock = getData( k );
                            if( stock ){
                                var inventory = getData( stock.item_barcode );
                                if( data.store_name && inventory && inventory.store && inventory.store[ data.store_name ] ){
                                    var tmp_store_data = inventory.store[ data.store_name ];
                                    
                                    if( tmp_store_data.stock ){
                                        delete tmp_store_data.stock[ key ];
                                    }
                                    
                                    if( tmp_store_data.item_qty ){
                                        tmp_store_data.item_qty -= parseFloat( stock.item_qty );
                                        
                                        tmp_store_data.item_available = tmp_store_data.item_qty;
                                        if( tmp_store_data.item_sold )
                                            tmp_store_data.item_available -= tmp_store_data.item_sold;
                                    }else{
                                        tmp_store_data.item_qty = 0;
                                        tmp_store_data.item_available = 0;
                                    }
                                    
                                    inventory.store[ data.store_name ] = tmp_store_data;
                                    putData( stock.item_barcode , inventory );
                                    if( ! storeObjects[ 'inventory_list' ] )storeObjects[ 'inventory_list' ] = {};
                                    storeObjects[ 'inventory_list' ][ stock.item_barcode ] = inventory;
                                }
                                clearSingleData( k );
                                var obj1 = getData( stock.object );
                                if( obj1[ k ] ){
                                    delete obj1[ k ];
                                }
                                putData( stock.object , obj1 );
                                unQueueUpload( {key:k, object:stock.object, "delete":"delete" } );
                                
                                clearSingleData( 'e'+k );
                                var obj1 = getData( 'expenses' );
                                if( obj1[ 'e'+k ] ){
                                    delete obj1[ 'e'+k ];
                                }
                                putData( 'expenses' , obj1 );
                                unQueueUpload( {key:'e'+k, object:'expenses', "delete":"delete" } );
                            }
                        });
                        //hours part from the timestamp
                        if( data.timestamp ){
                            var date = new Date( data.timestamp );
                            var day = date.getDate();
                            var month = date.getMonth();
                            var year = date.getFullYear();
                            
                            if( day < 10 )day = '0'+day;
                            if( month < 10 )month = '0'+month;
                            var cache_key = 'stock' + year + '-' + month + '-' + day;
                            
                            var cache = getData( cache_key );
                            if( cache && cache[ key ] )
                                delete cache[ key ];
                                
                            putData( cache_key , cache );
                        }
                    }
                    $('#container-'+key).remove();
                    settings.message_message = 'Supply record have been successfully deleted and items removed from stocked';
                break;
                }
                
                clearSingleData( key );
				var obj = getData( object );
				if( obj[ key ] ){
					delete obj[ key ];
				}
				putData( object , obj );
				
                if( storeObjects[ object ] && storeObjects[ object ][ key ] ){
					delete storeObjects[ object ][ key ];
				}
                
				unQueueUpload( {key:key, object:object, "delete":"delete" } );
                
                display_popup_notice( settings );
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
		//wait for 1second due to stock additions
        //REMOVE LATER - when finish moves to a different page
        setTimeout( function(){
            uploadData();
        }, 1000 );
	});
};

function clearSingleData( key ){
	amplify.store( key , null );
};
	
function getAllData(){
    var i = 0,
    oJson = {},
    sKey;
    for (; sKey = window.localStorage.key(i); i++) {
        oJson[sKey] = window.localStorage.getItem(sKey);
    }
    return oJson;
};

function clearData(){
	var storedObjects = amplify.store();
	
	//console.log('all',  storedObjects );
	//ga('send', 'pageview', {'page': '/user-triggered-refresh' , 'title': 'User Refreshed App' });
	
	$.each( storedObjects , function ( key , value ){
		switch( key ){
		case 'custom-uuid':
		case 'last-compile-time':
        case 'device-id':
        case 'lock-id':
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
			ajax_data.store_id = currentStoreID;
			ajax_data.store_owner_id = customUUID;
		}
		if( customUUID ){
			ajax_data.app_uid = customUUID;
		}
		if( deviceID ){
			ajax_data.app_device_id = deviceID;
		}
	//Send Data to Server
	$.ajax({
		dataType:ajax_data_type,
		type:form_method,
		data:ajax_data,
        crossDomain:true,
		url: pagepointer+'php/app_request_processor.php'+ajax_get_url,
		timeout:80000,
		beforeSend:function(){
			//Display Loading Gif
			function_click_process = 0;
			
			cancel_ajax_recursive_function = false;
			
			confirm_action_prompt = 0;
			
			/*ajax_container.html('<div id="loading-gif" class="no-print">Please Wait</div>');*/
			
			$('div.progress-bar-container')
			.html('<div class="virtual-progress-bar"><div class="progress-bar"></div></div>');
			
			progress_bar_change();
			
            if( uploadDataSize ){
                switch( ajax_get_url ){
                case '?action=upload_data&todo=get_upload_data':
                case '?action=upload_data&todo=get_last_upload_dataset':
                    active_page = get_active_page_id();
                    switch( active_page ){
                    case 'dashboard':
                    case 'inventory':
                    case 'sales':
                    case 'settings':
                        var size = ( uploadDataSize / 1024 );
                        var $title = $( '#'+active_page ).find('h1:first');
                        
                        if( ! $title.hasClass('uploading-data-title') ){
                            $title
                            .addClass('uploading-data-title')
                            .attr( 'default-text' , $title.html() )
                            .html( '<span>( '+size.toFixed(1)+'KB ) Updating Server...</span>' );
                        }
                    break;
                    }
                break;
                }
                uploadDataSize = 0;
            }
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
	if( $('h1.uploading-data-title') && $('h1.uploading-data-title').attr('default-text') ){
        $('h1.uploading-data-title')
        .html( $('h1.uploading-data-title').attr('default-text') )
        .removeClass('uploading-data-title');
    }
    function_click_process = 1;
    /*REMOVE LATER - for airtel
    if( event.responseText.trim.length > 0 ){
        var settings = {
            'message_title':'Request Error',
            'message_message':event.responseText,
        };
        display_popup_notice( settings );
    }
    */
};

var registration = false;

function ajaxSuccess( data , store ){
	/*store data in local storage*/
	if( $('h1.uploading-data-title') && $('h1.uploading-data-title').attr('default-text') ){
        $('h1.uploading-data-title')
        .html( $('h1.uploading-data-title').attr('default-text') )
        .removeClass('uploading-data-title');
    }
    
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
            deviceID = '';
            
			if( data.device_id ){
                deviceID = data.device_id;
                putData( deviceIDkey , data.device_id );
            }
            
            if( deviceID ){
                if( data.saved_record_id && tempData ){
                    //store data
                    putData( customUUIDkey , data.saved_record_id );
                    putData( appUIDkey , data.saved_record_id );
                    
                    if( data.account_activation )putData( lockIDkey , data.account_activation );
                    
                    ga( 'send' , 'pageview' , {'page': '/registered-user' , 'title': 'User Registered '+customUUID+'/'+data.saved_record_id } );
                    
                    customUUID = data.saved_record_id;
                    appUserID = data.saved_record_id;
                    
                    tempData.key = data.saved_record_id;
                    tempData.id = data.saved_record_id;
                    
                    var stored = store_record( tempData );
                    successful_submit_action( stored );
                    
                    if( data.begin_download ){
                        tempDownloadObjects = data.begin_download;
                        registration = true;
                        
                        $.mobile.navigate( "#update-progress", { transition : "none" } );
                    }else{
                        $.mobile.navigate( "#dashboard", { transition : "none" });
                    }
                    data.typ = '';
                }
            }else{
                cannot_initiate_app();
            }
		break;
        case 'saved-user-profile-data':
            if( data.saved_record_id && tempData ){
                tempData.key = data.saved_record_id;
				tempData.id = data.saved_record_id;
                
                var uData = getData( tempData.key );
                $.each( tempData , function( k, v ){
                    uData[k] = v;
                });
                
                var stored = store_record( uData );
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
				
                if( stored && stored.role )$('body').addClass(stored.role).attr('data-user-role', stored.role );
                
				var users_list = add_to_list_of_users( stored );
				update_users_list_on_users_page( "#mngusers" );
				
				tempData = {};
				//console.log( 'user created' , stored );
				
				data.typ = '';
			}
		break;
		case 'logged-in-user':
			ajax_data = {};
			ajax_get_url = '';
			
			if( ( ! deviceID ) && data.device_id ){
                deviceID = data.device_id;
                putData( deviceIDkey , data.device_id );
            }
            
            if( deviceID ){
                if( data.user_details.id && data.user_details.key && data.user_details.app_uid ){
                    //store data
                    putData( customUUIDkey , data.user_details.app_uid );
                    putData( appUIDkey , data.user_details.id );
                    
                    if( data.account_activation )putData( lockIDkey , data.account_activation );
                    
                    ga( 'send' , 'pageview' , {'page': '/logged-in-user' , 'title': 'User Login '+customUUID+'/'+data.user_details.app_uid } );
                    
                    customUUID = data.user_details.app_uid;
                    
                    appUserID = data.user_details.id;
                    tempData = data.user_details;
                    
                    var stored = store_record( tempData );
                    
                    if( stored && stored.role )$('body').addClass(stored.role).attr('data-user-role', stored.role );
                    
                    if( data.begin_download ){
                        registration = true;
                        tempDownloadObjects = data.begin_download;
                        $.mobile.navigate( "#update-progress", { transition : "none" } );
                    }else{
                        $.mobile.navigate( "#dashboard", { transition : "none" });
                    }
                    
                    data.typ = '';
                }
            }else{
                cannot_initiate_app();
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
		case 'data-download-progress-after-upload':
			ajax_data = {};
			ajax_get_url = '';
			
			if( data.continue_download ){
				//store data
				ga( 'send' , 'pageview' , {'page': '/data-download' , 'title': 'Data Download '+customUUID } );
				
				if( data.continue_download ){
					update_and_re_trigger_data_download_after_upload( data.continue_download );
				}else{
					//$.mobile.navigate( "#dashboard", { transition : "none" });
				}
				
			}
		break;
		case 'data-download-complete':
			ajax_data = {};
			ajax_get_url = '';
            
            appSettings = {};
            set_general_settings();
            
            if( $('#update-progress-area') ){
                $('#update-progress-area')
                .prepend( '<li><img src="" id="downloading-image-files-container" style="max-width:150px; margin:auto;"/> Downloading Image Files </li>' );
            }
            
            prepare_notifications_for_display();
            
            //start downloading images that don't exists
            if( ! blubirdWebbased ){
                if( registration ){
                    registration = false;
                    movePackedFiles();
                }else{
                    downloadFiles();
                }
            }
			//store data
			ga( 'send' , 'pageview' , {'page': '/data-download-complete' , 'title': 'Data Download Complete '+customUUID } );
		break;
		case 'uploaded-data':
			if( data.keys ){
				var a = getData( uploadDataKey );
				$.each( data.keys , function( key , id ){
					if( a[key] )delete a[key];
					
					var d = getData( key );
					if( d && d.key && d.id ){
                        d.id = id;
                        putData( key , d );
                    }
				});
				
				putData( uploadDataKey , a );
                
                if( data.trigger_download ){
                    check_for_data_to_download();
                }
                
                if( $('.update-server-button-container') ){
                    $('.update-server-button-container')
                    .addClass('hidden');
                }
            
			}
		break;
        case 'trigger-download':
            check_for_data_to_download();
        break;
        case 'generated-report':
            if( data.preview && $('#reports-preview') ){
                $('#reports-preview')
                .html( data.preview );
            }
        break;
		}
	}
	
	if( data.report_options ){
		putData( 'reports' , data.report_options );
	}
	
	if( data.typ ){
		switch(data.typ){
		case 'serror':
		case 'uerror':
		case 'saved':
		case 'generated-report':
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
	
};

//check_for_data_to_download();
function check_for_data_to_download(){
    ajax_data = { app_uid: customUUID };
    form_method = 'post';
    ajax_data_type = 'json';
    ajax_action = 'request_function_output';
    ajax_container = $('#login-form');
    ajax_get_url = '?action=data_transfer&todo=check_for_data_to_download_after_upload';
    ajax_send();
};

//Bind Multi-select option tooltip
var timer_interval;
var mouse_vertical_position;

var progress_bar_timer_id;
function progress_bar_change(){
	var total = 80;
	var step = 1;
	
    if( progress_bar_timer_id )
        clearTimeout(progress_bar_timer_id);
        
	if(function_click_process==0){
		var $progress = $('.virtual-progress-bar:visible').find('.progress-bar');
		
		if($progress.data('step') && $progress.data('step')!='undefined'){
			step = $progress.data('step');
		}
		
		var percentage_step = ( step / total ) * 100;
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
				display_popup_notice( settings );
                
                internetConnection = false;
			}else{
				//display retrying msg
				
				var settings = {
					message_title:'Refreshing...',
					message_message: 'Please Wait.',
					auto_close: 'yes'
				};
				//display_popup_notice( settings );
                
				//request resources again
				ajax_send();
				
			}
			
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
  var num1 = num.replace('-','');
  var dec = n[1];
  var r, s, t;

  if (num1.length > 3) {
	s = num1.length % 3;

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
				pointFormat: '{series.name}: <b>{point.y}</b>'
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
				name: 'Units sold today',
				data: data.dataset,
			}]
		});
	}
};

function barchart( data ){
	if( data.id && data.label ){
		
        $( data.id ).highcharts({
            title: {
                text: ''
            },
             tooltip: {
                pointFormat: '{series.name}: N <b>{point.y}</b>'
            },
            xAxis: {
                categories: data.label
            },
            labels: {
                items: [{
                    html: '',
                    style: {
                        left: '28em',
                        top: '0.5em',
                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'black'
                    }
                }]
            },
            
            series: [{
                type: 'column',
                name: 'Total Sales',
                color: 'rgb(124,181,236)',
                data: data.sales
            },{
                type: 'column',
                name: 'Gross Profit',
                color: 'rgb(144,237,125)',
                data: data.profit
            }, ]
        });
	}
};

function fail(message) {
  // Do nothing.
  uploadingImageInprogess = 0;
  
  var m = '';
  if( message ){
    $.each( message, function(a,b){
    m += a+': '+b+'\n\n';
  });
  }
  alert(m);
};

function conlog(obj) {
  // Do nothing.
  
  var m = 'nothing\n';
  if( obj ){
  $.each( obj, function(a,b){
    m += a+': '+b+'\n\n';
  });
  }
  alert(m);
  
};

function gotPictureTest(imageURI) {
  var timestamp = new Date().getTime();
  
    var barcode = $('#newInventory').find('input[name="item_barcode"]').val();
  if( ! barcode )barcode = 'a'+timestamp;
    var fileName = barcode+'.jpg';
  
  var image = document.getElementById('myImage');
    image.src = imageURI;
		
	$('#newInventory')
	.find('input[name="item_image"]')
	.val( imageURI );
	
    imageURLsrc = imageURI;
	//alert('file loc '+imageURI);
    
  moveImageUriFromTemporaryToPersistent(imageURI, fileName, function(newImageURI) {
      var image = document.getElementById('myImage');
     image.src = newImageURI;
    
    var barcode = $('#newInventory').find('input[name="item_barcode"]').val();
    if( ! barcode )barcode = timestamp;
    var fileName = barcode+'.jpg';
    
    if( ! uploadImages )uploadImages = {};
    uploadImages[ barcode ] = newImageURI;
    
     $('#newInventory')
	.find('input[name="item_image"]')
	.val( fileName );
    
     $('#newInventory')
	.find('input[name="image"]')
	.val( 'icon.png' );
    //alert('file new name'+fileName);
    
    //alert('new file loc '+newImageURI);
  });
  
   //window.requestFileSystem( LocalFileSystem.PERSISTENT, 0, initFileSystem, fail );
};

function moveImageUriFromTemporaryToPersistent(imageURI, newFileName, callbackFunction) {
//cordova.file.externalApplicationStorageDirectory
 window.resolveLocalFileSystemURI(imageURI, function(temporaryEntry) {
    //conlog(temporaryEntry);
    window.requestFileSystem( LocalFileSystem.PERSISTENT, 0, function(persistentFileSys) {
        //conlog(persistentFileSys);
      persistentFileSys.root.getDirectory( 'blubirdimagebank', {create: true, exclusive: false}, function(persistentDirectory) {
        
        //conlog(persistentDirectory);
          persistentDirectory.getFile(newFileName, {create: true, exclusive: false}, function(persistentEntry) {
            //conlog(persistentEntry);
            temporaryEntry.file(function(oldFile) {
                //conlog(oldFile);
              var reader = new FileReader();
              reader.onloadend = function(evt) {
                //conlog(evt);
                persistentEntry.createWriter(function(writer) {
                    //conlog(writer);
                  writer.onwrite = function(evt) {
                    temporaryEntry.remove();
                    callbackFunction(persistentEntry.toURL());
                  };
                  writer.write(evt.target.result);
                }, fail);
              };
              reader.readAsArrayBuffer(oldFile);
            }, fail);
          }, fail);
        
      }, fail);
    }, fail);
  }, fail);
};