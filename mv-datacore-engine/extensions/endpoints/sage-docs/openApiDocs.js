const tag = "Sage";
const apiDoc = {
	openapi: "3.0.0",
	info: {
			version: "1.0.0",
			title: "Sage API Documentation",
	},
	servers: [
			{
					url: "/",
			},
	],
	// security: ["bearerAuth"],
	paths: {
		"/auth/login": {
			post: {
				tags: ["Auth"],
				requestBody: {
					content: {
						"application/json": {
							schema: {
								"$ref": "#/components/schemas/AuthLogin"
							}
						}
					}
				},
				responses: {
					200 : {
						description: "Post Auth Login",
						content: {
							"application/json": {
								schema: {
									properties: {
										data: {
											type: "object",
											properties: {
												access_token: {
													type: "string"
												},
												expires: {
													type: "number"
												},
												refresh_token: {
													type: "string"
												},
											}
										},
									}
								}
							}
						}
					}
				}
			}
		},
		"/sage": {
			post: {
				tags: [tag],
				requestBody: {
					content: {
						"application/json": {
							schema: {
								"$ref": "#/components/schemas/Sage"
							}
						}
					}
				},
				responses: {
					200 : {
						description: "Post Sage",
						content: {
							"application/json": {
								schema: {
									properties: {
										success: {
											type: "boolean"
										},
										data: {
											type: "array",
											items: {
												properties: {
													id: {
														type: "integer"
													}
												}
											},
										},
										message: {
											type: "string"
										}
									}
								}
							}
						}
					}
				}
			}
		},
		"/sage/preview": {
			post: {
				tags: [tag],
				requestBody: {
					content: {
						"application/json": {
							schema: {
								"$ref": "#/components/schemas/PreviewSage"
							}
						}
					}
				},
				responses: {
					200 : {
						description: "Post Sage Preview",
						content: {
							"application/json": {
								schema: {
									properties: {
										success: {
											type: "boolean"
										},
										data: {
											type: "array",
											items: {
												properties: {
													id: {
														type: "integer"
													}
												}
											},
										},
										message: {
											type: "string"
										}
									}
								}
							}
						}
					}
				}
			}
		},
		"/sage/databases": {
			post: {
				tags: [tag],
				requestBody: {
					content: {
						"application/json": {
							schema: {
								"$ref": "#/components/schemas/DatabasesSage"
							}
						}
					}
				},
				responses: {
					200 : {
						description: "Post Sage Databases",
						content: {
							"application/json": {
								schema: {
									properties: {
										success: {
											type: "boolean"
										},
										data: {
											type: "array",
											items: {
												properties: {
													id: {
														type: "integer"
													}
												}
											},
										},
										message: {
											type: "string"
										}
									}
								}
							}
						}
					}
				}
			}
		},
		"/sage/tables": {
			post: {
				tags: [tag],
				requestBody: {
					content: {
						"application/json": {
							schema: {
								"$ref": "#/components/schemas/TablesSage"
							}
						}
					}
				},
				responses: {
					200 : {
						description: "Post Sage Tables",
						content: {
							"application/json": {
								schema: {
									properties: {
										success: {
											type: "boolean"
										},
										data: {
											type: "array",
											items: {
												properties: {
													id: {
														type: "integer"
													}
												}
											},
										},
										message: {
											type: "string"
										}
									}
								}
							}
						}
					}
				}
			}
		},
		"/sage/columns": {
			post: {
				tags: [tag],
				requestBody: {
					content: {
						"application/json": {
							schema: {
								"$ref": "#/components/schemas/ColumnsSage"
							}
						}
					}
				},
				responses: {
					200 : {
						description: "Post Sage Columns",
						content: {
							"application/json": {
								schema: {
									properties: {
										success: {
											type: "boolean"
										},
										data: {
											type: "array",
											items: {
												properties: {
													id: {
														type: "integer"
													}
												}
											},
										},
										message: {
											type: "string"
										}
									}
								}
							}
						}
					}
				}
			}
		}
	},
	components: {
			schemas: {
				ErrorResponse: {
						type: "object",
						properties: {
								statusesId: {
										type: "string",
								},
								message: {
										type: "string",
								},
						},
				},
				AuthLogin: {
					title: "Post Auth",
					type: "object",
					properties: {
						email: {
							type: "string"
						},
						password: {
							type: "string"
						},
					}
				},
				Sage: {
					title: "Post Sage",
					type: "object",
					properties: {
						credential: {
							type: "number"
						},
						database: {
							type: "string"
						},
						table: {
							type: "string"
						},
						columns: {
							type: "array",
							items: {
								properties: {
									name: {
										type: "string",
									},
									as: {
										type: "string",
									}
								}
							}
						},
						custom_columns: {
							type: "array",
							items: { type: "object" }
						},
						join: {
							type: "array",
							items: { type: "object" }
						},
						filters: {
							type: "array",
							items: { 
								properties: {
									column: {
										type: "string"
									},
									operator: {
										type: "string"
									},
									value: {
										type: "number"
									}
								},
							}
						},
						sorts: {
							type: "array",
							items: { type: "object" }
						},
						summarizes: {
							type: "array",
							items: { type: "object" }
						},
						summarize_by: {
							type: "array",
							items: { type: "object" }
						},
						summarizes: {
							type: "number",
						},
					}
				},
				PreviewSage: {
					title: "Post Sage Preview",
					type: "object",
					properties: {
						credential: {
							type: "number"
						},
						query: {
							type: "string"
						},
					}
				},
				DatabasesSage: {
					title: "Post Sage Database",
					type: "object",
					properties: {
						credential: {
							type: "number"
						},
					}
				},
				TablesSage: {
					title: "Post Sage Table",
					type: "object",
					properties: {
						credential: {
							type: "number"
						},
						database: {
							type: "string"
						},
					}
				},
				ColumnsSage: {
					title: "Post Sage Column",
					type: "object",
					properties: {
						credential: {
							type: "number"
						},
						database: {
							type: "string"
						},
						table: {
							type: "string"
						},
					}
				},
			},
			securitySchemes: {
					jwt : {
							type : "http",
							scheme: "bearer",
							bearerFormat : "JWT"
					},
			},
	},
	security : [
			{
					jwt : []
			}
	]
};

exports.default = () => {
	return apiDoc;
};
