import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CSVLink } from "react-csv";
import "../index.css";
import styled from "styled-components";
import Papa from "papaparse";
import Navbar from "../Components/Navbar";

function getUserdetails() {
  const dtFromHmpg = useLocation();

  const envType = useLocation();

  const [parsedData, setParsedData] = useState([]);

  const [csvData, setCSVData] = useState([]);

  //State to store table Column name
  const [tableRows, setTableRows] = useState([]);

  //Msg for null instances
  const [errMsg, setErrMsg] = useState(false);

  //State to store the values
  const [values, setValues] = useState([]);

  const [getDataFlag, setDataFlag] = useState(false);

  const [showSpinner, setShowSpinner] = useState(false);

  const [tokenSpinner, setTokenSpiiner] = useState(true);
  const [showAPIBtn, setAPIBtn] = useState(true);
  //

  useEffect(() => {
    if (dtFromHmpg.state.envType == "UAT") {
      fetch("/smplcnsvrftn/generatetoken", {
        method: "GET",
      })
        .then((res) => res.json())
        .then((val) => {
          setTokenSpiiner(false);
        });
    }
  }, []);

  const headersForCSV = [
    { label: "Account Name", key: "account_name" },
    { label: "Email", key: "email" },
    { label: "Account SFDC", key: "sfdc_account_id" },
    { label: "Country", key: "country_iso" },
    { label: "Market Type", key: "market_type" },
    { label: "Partner SFDC", key: "Parent_sfdc_account_id" },
    { label: "Parent Account Name", key: "Parent_account_name" },
    { label: "Parent Relationship", key: "parent_relationship_type" },
    { label: "Comment", key: "comment" },
  ];

  var promiseResult;
  const filterDataOnItemNumber = async () => {
    setShowSpinner(true);
    setAPIBtn(false);
    if (dtFromHmpg.state.envType == "SIT") {
      console.timeEnd("for {}");
      console.time(".map()");
      promiseResult = await Promise.all(
        values?.map(async (val) => {
          console.log();
          await fetch("/smplcnsvrftn/getaccountdetails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sfdc_Id: val[1].replace(/\s+/g, ""),
              email: val[0].replace(/\s+/g, ""),
            }),
          })
            .then((val) => val.json())
            .then((res) => {
              console.log(res);
              filterDataBsdOnItmNumber(res, val[0], val[1]);
            });
        })
      );
      setShowSpinner(false);
      setDataFlag(true);
    } else {
      console.time(".map()");
      promiseResult = await Promise.all(
        values?.map(async (val) => {
          await fetch(
            "/smplcnsvrftn/getaccountdetailsforuat",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sfdc_Id: val[1].replace(/\s+/g, ""),
                email: val[0].replace(/\s+/g, ""),
              }),
            }
          )
            .then((val) => val.json())
            .then((res) => {
              console.log(res);
              filterDataBsdOnItmNumber(res, val[0], val[1]);
            });
        })
      );
      setShowSpinner(false);
      setDataFlag(true);
    }
  };

  const filterDataBsdOnItmNumber = (responseArray, email, Sfdc) => {
    console.log(responseArray);
    if (
      responseArray != "The user is not associated with the given SFDC account"
    ) {
      responseArray.account_details.map((fd) => {
        if (fd.parent_account_id.lenth != 0) {
          console.log(fd);
          fd?.parent_account_id?.map((val, index) => {
            const dataArray = {
              account_name: fd.account_name != null ? fd.account_name : "-",
              email: email,
              sfdc_account_id: fd.sfdc_account_id,
              country_iso: fd.country,
              market_type: fd.market_type,
              Parent_account_name: val.account_name,
              Parent_sfdc_account_id: val.sfdc_account_id,
              parent_relationship_type: val.parent_relationship_type,
            };
            setCSVData((prevData) => [...prevData, dataArray]);
          });
        }
      });
    } else {
      const dataArray = {
        login_id: email,
        sfdc_account_id: Sfdc,
        comment: responseArray,
      };
      console.log(dataArray);
      setCSVData((prevData) => [...prevData, dataArray]);
    }
  };

  console.log(csvData);

  const changeHandler = (event) => {
    // Passing file data (event.target.files[0]) to parse using Papa.parse
    Papa.parse(event.target.files[0], {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const rowsArray = [];
        const valuesArray = [];

        // Iterating data to get column name and their values
        results.data.map((d) => {
          rowsArray.push(Object.keys(d));
          valuesArray.push(Object.values(d));
        });

        // Parsed Data Response in array format
        setParsedData(results.data);

        // Filtered Column Names
        setTableRows(rowsArray[0]);

        // Filtered Values
        setValues(valuesArray);
      },
    });
  };

  return (
    <>
      {dtFromHmpg.state.envType == "UAT" ? (
        tokenSpinner ? (
          <OuterContainer1>
            <span className="tokenLoader"></span>
          </OuterContainer1>
        ) : (
          <OuterContainer>
            <Navbar
              envType={dtFromHmpg.state.envType}
              apiName={"GetAccountDetail"}
            />
            File Uploader
            <input
              type="file"
              name="file"
              onChange={changeHandler}
              onClick={() => setDataFlag(false)}
              accept=".csv"
              style={{ display: "block", margin: "10px auto" }}
            />
            <br />
            <br />
            <table>
              <thead>
                <tr>
                  {tableRows.map((rows, index) => {
                    return <th key={index}>{rows}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {values.map((value, index) => {
                  return (
                    <tr key={index}>
                      {value.map((val, i) => {
                        return <td key={i}>{val}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Btn
              disabled={values.length == 0 && showAPIBtn}
              onClick={() => filterDataOnItemNumber()}
            >
              Generate CSV File
            </Btn>
            {showSpinner ? (
              <span class="loader"></span>
            ) : getDataFlag ? (
              <Btn style={{ marginTop: "20px" }}>
                <CSVLink
                  style={{
                    color: "white",
                    textDecoration: "none",
                    visibility: csvData.length == 0 ? "hidden" : "visible",
                  }}
                  data={csvData}
                  headers={headersForCSV}
                >
                  Download CSV
                </CSVLink>
              </Btn>
            ) : null}
            {errMsg ? (
              <h5>
                There are no subscriptions for given SFDC Ids with given item
                numbers
              </h5>
            ) : null}
          </OuterContainer>
        )
      ) : (
        <OuterContainer>
          <Navbar
            envType={dtFromHmpg.state.envType}
            apiName={"GetAccountDetail"}
          />
          File Uploader
          <input
            type="file"
            name="file"
            onChange={changeHandler}
            onClick={() => setDataFlag(false)}
            accept=".csv"
            style={{ display: "block", margin: "10px auto" }}
          />
          <br />
          <br />
          <table>
            <thead>
              <tr>
                {tableRows.map((rows, index) => {
                  return <th key={index}>{rows}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {values.map((value, index) => {
                return (
                  <tr key={index}>
                    {value.map((val, i) => {
                      return <td key={i}>{val}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Btn disabled={showAPIBtn} onClick={() => filterDataOnItemNumber()}>
            Generate CSV File
          </Btn>
          {showSpinner ? (
            <span class="loader"></span>
          ) : getDataFlag ? (
            <Btn style={{ marginTop: "20px" }}>
              <CSVLink
                style={{
                  color: "white",
                  textDecoration: "none",
                  visibility: csvData.length == 0 ? "hidden" : "visible",
                }}
                data={csvData}
                headers={headersForCSV}
              >
                Download CSV
              </CSVLink>
            </Btn>
          ) : null}
          {errMsg ? (
            <h5>
              There are no subscriptions for given SFDC Ids with given item
              numbers
            </h5>
          ) : null}
        </OuterContainer>
      )}
    </>
  );
}

export default getUserdetails;

const OuterContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const OuterContainer1 = styled.div`
  background-color: white;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const TextContainer = styled.h2`
  margin-top: 0%;
  width: 100vw;
  height: 50px;
  background-color: #262626;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Btn = styled.button`
  min-width: 100px;
  height: 30px;
  cursor: pointer;
  margin: 5px;
  background-color: rgba(0, 0, 0, 0.9);
  border-radius: 4px;
  border: none;
  color: white;
  font-weight: 600;
  :active {
    background-color: rgba(0, 0, 0, 0.6);
    transform: translateY(2px);
  }
`;
