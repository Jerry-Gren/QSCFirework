# Welcome to zjuamLogin-test

A naive tool for researching zjuamLogin.
    
## What this project is about

It simuates the login process of zjuam.

## Requirements for building

1. Golang version 1.21.1 (type `go version` to check).

2. Golang's net support, any compatible version (mirror: `https://github.com/golang/net`)

3. goquery support, any compatible version (origin: `https://github.com/PuerkitoBio/goquery`)
   Tested version is 1.8.1

## How to build and run

1. Clone the source code into a directory, and `cd` into it.

2. On a terminal (PowerShell Recommended), enter `go env -w GO111MODULE=auto`. This will give instructions on where to load support libs in the following steps.

3. Enter `go build zjuam.go`. If this raises an error, follow the instructions to fix them.

4. Enter `./zjuam.exe`.

## Functions and their usage

### encrypt_RSA(pub *rsa.PublicKey, data []byte) []byte

This function encrypts `data` using the RSA method. `pub` is the public key, which is formatted into `*rsa.PublicKey`.

Function returns encrypted data in `[]byte`.

### getPubKey() string

This function has no input value.

Function returns `Modulus` sector of public key fetched from /v2/getPubKey. The return value is formatted into `[]byte`.

### getExecution() string

This function has no input value, and simply returns the value of `execution`.

## Tips

The program is defective however, because it CANNOT save Cookie and use it in future requests yet.

I guess that if I save Cookie when getting public key will fix this problem.

Be that as it may, other functions works well, and can give the right encoded password, which I think should be the key point of this quiz.