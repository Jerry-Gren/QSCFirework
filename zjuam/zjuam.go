package main

import (
	"crypto/rsa"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// 定义一个结构体，用于存储JSON中的数据
type Key struct {
	Modulus  string `json:"modulus"` // 指定JSON中的字段名和结构体中的字段名相对应
	Exponent string `json:"exponent"`
}

// 用Modulus和exponent构造RSA公钥
// 为什么E写65537？因为实际上是0x10001，这是公钥的通常值，写成Base64就是AQAB
// var modulus = "c9ea380e918e0148dd71a63df779cd25e8907a1e09dbb85d6a2513a09af3243caad1c5d46d1f4469e20d596e242471d6debffc2a1492a33673c70172ec14f76b"
var modulus = getPubKey()
var Public_RSA_Key = rsa.PublicKey{
	N: fromMod(modulus),
	E: 65537,
}

// 版权：Mr. 泽源
func fromMod(modulus string) *big.Int {
	res, err := new(big.Int).SetString(modulus, 16)
	if !err {
		panic("Bad number: %s" + modulus)
	}
	return res
}

// RSA加密
func encrypt_RSA(pub *rsa.PublicKey, data []byte) []byte {
	encrypted := new(big.Int)
	e := big.NewInt(int64(pub.E))
	payload := new(big.Int).SetBytes(data)
	encrypted.Exp(payload, e, pub.N)
	return encrypted.Bytes()
}

// 获取Modulus的值
func getPubKey() string {
	url := "https://zjuam.zju.edu.cn/cas/v2/getPubKey"
	res, err := http.Get(url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "fetch: %v\n", err)
		os.Exit(1)
	}
	body, err := io.ReadAll(res.Body)
	defer res.Body.Close()
	if err != nil {
		fmt.Fprintf(os.Stderr, "fetch: reading %s: %v\n", url, err)
		os.Exit(1)
	}
	// fmt.Printf("%s\n", body)
	var key Key
	json.Unmarshal(body, &key)
	mod := key.Modulus
	return mod
}

// 解析html文件，输出Execution的值
func getExecution() string {
	url := "https://zjuam.zju.edu.cn/cas/login"
	resp, err := http.Get(url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "fetch: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		log.Fatal(err)
	}
	input := doc.Find("input[type=hidden][name=execution]")
	value, _ := input.Attr("value")
	return value
}

func main() {
	var Execution = getExecution()
	fmt.Println("modulus: ")
	fmt.Println(modulus)

	// 输入用户名和密码
	var username, password string
	fmt.Println("username: ")
	fmt.Scan(&username)
	fmt.Println("password: ")
	fmt.Scan(&password)

	// 太nb了，这里的密码竟然不需要反转
	packet := []byte(password)
	encrypted := encrypt_RSA(&Public_RSA_Key, packet)
	fmt.Printf("packet: %x \nencrypted: %x \nlength: %d\n", packet, encrypted, len(encrypted))

	fmt.Println("Start POST.")
	// 定义要发送的数据
	data := url.Values{
		"username":  {username},
		"password":  {string(encrypted)},
		"execution": {Execution},
		"_eventId":  {"submit"},
		"authcode":  {""},
	}
	resp, err := http.Post("https://zjuam.zju.edu.cn/cas/login?service=http%3A%2F%2Fzdbk.zju.edu.cn%2Fjwglxt%2Fxtgl%2Flogin_ssologin.html", "application/x-www-form-urlencoded",
		strings.NewReader(data.Encode()))
	if err != nil {
		fmt.Println(err) // 处理错误
	}

	// cookie保存和输出
	cookies := resp.Cookies()
	for _, c := range cookies {
		fmt.Printf("cookieName=%s; cookieValue=%s\n", c.Name, c.Value)
	}

	defer resp.Body.Close()
}
