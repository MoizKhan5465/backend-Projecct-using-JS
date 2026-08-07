class APIresponse {
  constructor(statusCode, data, messege = "success") {
    this.statusCode = statusCode;
    this.data = data;
    this.messege = messege;
    this.success = statusCode >= 200 && statusCode < 300;
  }
}

export { APIresponse };
