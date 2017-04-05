import { Injectable } from '@angular/core';
import { Http, Response, Headers, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { LocalStorageService, SessionStorageService } from 'ng2-webstorage';
import { AUTH0_CLIENT_ID, AUTH0_DOMAIN, AUTH0_LOGIN_URL } from '../../app.constants';
import { Authentication, WebAuth } from  'auth0-js';
import Auth0Lock from 'auth0-lock';
import { tokenNotExpired } from 'angular2-jwt';

@Injectable()
export class AuthServerProvider {

    // Configure Auth0
    lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, {
        auth: {
            responseType: 'token'
        }
    });

    webAuth = new WebAuth({
        domain: AUTH0_DOMAIN,
        clientID: AUTH0_CLIENT_ID
    });

    authentication = new Authentication({
        domain: AUTH0_DOMAIN,
        clientID: AUTH0_CLIENT_ID
    });

    redirectUri = 'http://' +  window.location.host + '/';

    constructor(
        private http: Http,
        private $localStorage: LocalStorageService,
        private $sessionStorage: SessionStorageService
    ) {}

    getToken () {
        return this.$localStorage.retrieve('authenticationToken') || this.$sessionStorage.retrieve('authenticationToken');
    }

    login (credentials): Observable<any> {
        let data = new URLSearchParams();
        data.append('grant_type', 'password');
        data.append('username', credentials.username);
        data.append('password', credentials.password);

        let headers = new Headers ({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization' : 'Basic d2ViX2FwcDo='
        });

        return this.http.post('uaa/oauth/token', data, {
            headers: headers
        }).map((resp) => {
            let accessToken = resp.json()['access_token'];
            if (accessToken) {
                this.storeAuthenticationToken(accessToken, credentials.rememberMe);
            }

            return accessToken;
        });
    }

    loginWithToken(jwt, rememberMe) {
        if (jwt) {
            this.storeAuthenticationToken(jwt, rememberMe);
            return Promise.resolve(jwt);
        } else {
            return Promise.reject('auth-jwt-service Promise reject'); // Put appropriate error message here
        }
    }

    storeAuthenticationToken(jwt, rememberMe) {
        if (rememberMe) {
            this.$localStorage.store('authenticationToken', jwt);
        } else {
            this.$sessionStorage.store('authenticationToken', jwt);
        }
    }

    logout () {
        this.$localStorage.clear();
        this.webAuth.logout({
            returnTo: this.redirectUri
        });
    }

    public getLock() {
        return this.lock;
    }

    public getWebAuth() {
        return this.webAuth;
    }

    public getAuthentication() {
        return this.authentication;
    }

    public isAuthenticated() {
        return tokenNotExpired('jhi_id_token');
    }

    public showLogin() {
        window.location.href = 'http://' + AUTH0_LOGIN_URL + '?redirect_uri=' + this.redirectUri;
    }
}
