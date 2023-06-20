import unisat_logo from '../unisat_logo.png'
import hiro_logo from '../hiro_logo.png'
import { InputGroup, Form, Row, Button, Col, Modal, Dropdown } from 'react-bootstrap'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './Login';
import axios from 'axios'
import { BASEURL, SALE_TYPE } from '../utils/constants';
import bcrypt from 'bcryptjs'
import { useNavigate } from "react-router-dom";

import DateTimePicker from 'react-datetime-picker'
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import { MaterialReactTable } from 'material-react-table';
import { Box, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Stack } from '@mui/material'
import { Delete, Edit } from '@mui/icons-material'

const setAuthToken = token => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = token;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

function Admin() {

    const [openDialog, handleDisplay] = useState(false);
    const [isSign, setIsSign] = useState(false)
    const [type, setType] = useState(SALE_TYPE.public)

    const navigate = useNavigate();

    const handleClose = () => {
        handleDisplay(false);
    };

    const fetchData = (saleType = null) => {

        const params = {
            type: saleType ? saleType : type
        };

        axios.get(
            BASEURL + '/api/admin/getData', { params },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).then(result => {
            if (result.data.success) {

                setStartDate(new Date(result.data.startDate) || new Date())
                setEndDate(new Date(result.data.endDate) || new Date())
                setFunds(result.data.funds || 7.5)
                setMin(result.data.min || 0)
                setMax(result.data.max || 0)
                setRatio(result.data.ratio || 0.00001)

                for (let i = 0; i < result.data.data.length; i++) {
                    result.data.data[i].address = renderLongString(result.data.data[i].address)
                    result.data.data[i].txid = renderLongString(result.data.data[i].txid)
                }

                setTableData(result.data.data || [])
            } else {
                toast.error(result.data.msg)
            }
        }).catch(error => {
            console.log('getfetch data error', error);
            toast.error('Get Data Failed')
        })
    }

    const onSignIn = (username, password) => {

        const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync());

        const params = {
            username: username,
            password: hashedPassword
        };

        axios.get(
            BASEURL + '/api/login', { params },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).then(result => {
            if (result.data.success) {
                setIsSign(true)
                window.localStorage.setItem('adminJwtToken', result.data.token)

                setAuthToken(result.data.token)
                fetchData();
                toast.success('Admin User Login Success')
            } else {
                setIsSign(false)
                window.localStorage.removeItem('adminJwtToken')
                toast.error(result.data.msg)
            }
        }).catch(error => {
            console.log('admin user login error', error);
            toast.error('Admin User Login Failed')
        })
    }

    useEffect(() => {
        let jwtToken = window.localStorage.getItem('adminJwtToken')
        // if (jwtToken) {
        //     setIsSign(true)
        //     setAuthToken(jwtToken)
        // } else {
        setIsSign(false)
        // }
        return () => {
            window.localStorage.removeItem('adminJwtToken');
        }
    }, [])

    const [startDate, setStartDate] = useState(new Date())
    const [endDate, setEndDate] = useState(new Date())
    const [funds, setFunds] = useState(7.5)
    const [min, setMin] = useState(0.0002)
    const [max, setMax] = useState(0.1)
    const [ratio, setRatio] = useState(0.00001)

    const handleStartDateChange = (value) => {
        let startTime;
        if (value) {
            startTime = (new Date(value));
        } else {
            startTime = new Date();
        }
        setStartDate(startTime);
    }

    const handleEndDateChange = (value) => {
        let endTime;
        if (value) {
            endTime = (new Date(value));
        } else {
            endTime = new Date();
        }
        setEndDate(endTime);
    }

    const renderLongString = (string) => {
        if (string && string.length > 8)
            return string.substr(0, 4) + '...' + string.substr(string.length - 4, 4)
        else return string || ''
    }

    // editable table
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [tableData, setTableData] = useState(() => []);
    const [validationErrors, setValidationErrors] = useState({});

    const handleCreateNewRow = (values) => {
        axios.post(
            BASEURL + '/api/admin/add',
            {
                address: values.address || '',
                code: values.code || '',
                bitcoin: values.bitcoin || 0,
                brc20: values.brc20 || 0,
                txid: values.txid || ''
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).then(result => {
            if (result.data.success) {
                toast.success('Success')
            } else {
                toast.error(result.data.msg)
            }
        }).catch(error => {
            console.log('save data error', error);
            toast.error('Failed')
        })
        tableData.push(values);
        setTableData([...tableData]);
    };

    const handleSaveRowEdits = async ({ exitEditingMode, row, values }) => {
        axios.post(
            BASEURL + '/api/admin/add',
            {
                address: values.address || '',
                code: values.code || '',
                bitcoin: values.bitcoin || 0,
                brc20: values.brc20 || 0,
                txid: values.txid || ''
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).then(result => {
            if (result.data.success) {
                toast.success('Success')
            } else {
                toast.error(result.data.msg)
            }
        }).catch(error => {
            console.log('edit data error', error);
            toast.error('Edit Failed')
        })
        if (!Object.keys(validationErrors).length) {
            tableData[row.index] = values;
            //send/receive api updates here, then refetch or update local table data for re-render
            setTableData([...tableData]);
            exitEditingMode(); //required to exit editing mode and close modal
        }
    };

    const handleCancelRowEdits = () => {
        setValidationErrors({});
    };

    const handleDeleteRow = useCallback(
        (row) => {
            if (
                !window.confirm(`Are you sure you want to delete ${row.original?.address}`)
            ) {
                return;
            }
            axios.post(
                BASEURL + '/api/admin/delete',
                {
                    address: row.original?.address || '',
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ).then(result => {
                if (result.data.success) {
                    toast.success('Success')
                } else {
                    toast.error(result.data.msg)
                }
            }).catch(error => {
                console.log('delete data error', error);
                toast.error('Delete Failed')
            })
            //send api delete request here, then refetch or update local table data for re-render
            tableData.splice(row.index, 1);
            setTableData([...tableData]);
        },
        [tableData],
    );

    const columns = [
        {
            accessorKey: 'address',
            header: 'Public Address',
            enableColumnOrdering: false,
            enableEditing: false, //disable editing on this column
            enableSorting: false,
            size: 100,
        },
        {
            accessorKey: 'bitcoin',
            header: 'Bitcoin',
            size: 100,
            muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
                type: 'number',
            }),
        },
        {
            accessorKey: 'brc20',
            header: 'Brc20',
            size: 100,
            muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
                type: 'number',
            }),
        },
        {
            accessorKey: 'code',
            header: 'Invitation Code',
            size: 100
        },
        {
            accessorKey: 'txid',
            header: 'Transaction ID',
            size: 100
        },
    ];

    const onSave = () => {

        axios.post(
            BASEURL + '/api/admin/save',
            {
                startDate: startDate,
                endDate: endDate,
                funds: funds,
                min: min,
                max: max,
                ratio: ratio,
                type: type
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).then(result => {
            if (result.data.success) {
                toast.success('Success')
            } else {
                toast.error(result.data.msg)
            }
        }).catch(error => {
            console.log('save data error', error);
            toast.error('Timeout Error. Login Again')
            if (error?.pa?.response?.data == "Unauthorized" || error?.response?.data == "Unauthorized") navigate("/")
        })
    }

    const handleSaleType = (saleType) => {
        if (saleType === type) return;
        else {
            setType(saleType);
            fetchData(saleType);
        }
    }

    return (
        <div className='main-bg flex flex-column w-full' style={{ height: 'fit-content' }}>
            <ToastContainer autoClose={3000} draggableDirection='x' />
            {isSign ? (
                <div className='flex justify-end items-center w-full mt-30'>
                    <Dropdown className='mr-30'>
                        <Dropdown.Toggle variant="primary" id="dropdown-basic">
                            {type === SALE_TYPE.public ? "PUBLIC SALE" : "WHITELIST SALE"}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => { handleSaleType(SALE_TYPE.public) }}>PUBLIC SALE</Dropdown.Item>
                            <Dropdown.Item onClick={() => { handleSaleType(SALE_TYPE.whitelist) }}>WHITELIST SALE</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    <Button onClick={() => { navigate("/") }} className='mr-30' variant="primary" size="md">Log Out</Button>
                </div>) : (
                <></>
            )}
            <div className='flex w-100 flex-column justify-center items-center mb-30' style={isSign ? {} : { height: '100vh' }}>
                {isSign ? (
                    <>
                        <div className='content-bg flex flex-column w-50 br-10 items-center p-30'>
                            {/* Presale Start Time */}
                            <Row className='fs-24 w-full'>
                                <Col sm={6} className='text-white'>Presale Start Time</Col>
                                <Col sm={6} className='text-white'>
                                    <DateTimePicker
                                        id="startDate"
                                        value={startDate}
                                        onChange={handleStartDateChange}
                                    />
                                </Col>
                            </Row>
                            {/* Presale End Time */}
                            <Row className='mt-30 fs-24 w-full'>
                                <Col sm={6} className='text-white'>Presale End Time</Col>
                                <Col sm={6} className='text-white'>
                                    <DateTimePicker
                                        id="endDate"
                                        value={endDate}
                                        onChange={handleEndDateChange}
                                        minDate={startDate}
                                    />
                                </Col>
                            </Row>
                            {/* Funds to raise */}
                            <Row className='mt-30 fs-24 w-full'>
                                <Col sm={6} className='text-white'>Funds to raise
                                    <span className='text-yellow' style={{ marginLeft: '4px' }}>(BTC)</span>

                                </Col>
                                <Col sm={6} className='text-white'>
                                    <InputGroup className='w-full'>
                                        <Form.Control
                                            min={0}
                                            value={funds}
                                            onChange={(e) => { setFunds(e.target.value) }}
                                            type='number'
                                            className='align-right trans-bg'
                                            aria-label="Large"
                                            aria-describedby="inputGroup-sizing-sm"
                                            style={{
                                                background: 'none',
                                                // border: 'none',
                                                color: "white"
                                            }}
                                        />
                                    </InputGroup>
                                </Col>
                            </Row>
                            {/* Min */}
                            <Row className='mt-30 fs-24 w-full'>
                                <Col sm={6} className='text-white'>Min
                                    <span className='text-yellow' style={{ marginLeft: '4px' }}>(BTC)</span>

                                </Col>
                                <Col sm={6} className='text-white'>
                                    <InputGroup className='w-full'>
                                        <Form.Control
                                            min={0}
                                            value={min}
                                            onChange={(e) => { setMin(e.target.value) }}
                                            type='number'
                                            className='align-right trans-bg'
                                            aria-label="Large"
                                            aria-describedby="inputGroup-sizing-sm"
                                            style={{
                                                background: 'none',
                                                // border: 'none',
                                                color: "white"
                                            }}
                                        />
                                    </InputGroup>
                                </Col>
                            </Row>
                            {/* Max */}
                            <Row className='mt-30 fs-24 w-full'>
                                <Col sm={6} className='text-white'>Max
                                    <span className='text-yellow' style={{ marginLeft: '4px' }}>(BTC)</span>

                                </Col>
                                <Col sm={6} className='text-white'>
                                    <InputGroup className='w-full'>
                                        <Form.Control
                                            min={min}
                                            value={max}
                                            onChange={(e) => { setMax(e.target.value) }}
                                            type='number'
                                            className='align-right trans-bg'
                                            aria-label="Large"
                                            aria-describedby="inputGroup-sizing-sm"
                                            style={{
                                                background: 'none',
                                                // border: 'none',
                                                color: "white"
                                            }}
                                        />
                                    </InputGroup>
                                </Col>
                            </Row>
                            {/* Ratio */}
                            <Row className='mt-30 fs-24 w-full'>
                                <Col sm={6} className='text-white'>Ratio</Col>
                                <Col sm={6} className='text-white'>
                                    <InputGroup className='w-full'>
                                        <Form.Control
                                            value={ratio}
                                            onChange={(e) => { setRatio(e.target.value) }}
                                            type='number'
                                            className='align-right trans-bg'
                                            aria-label="Large"
                                            aria-describedby="inputGroup-sizing-sm"
                                            style={{
                                                background: 'none',
                                                // border: 'none',
                                                color: "white"
                                            }}
                                        />
                                    </InputGroup>
                                </Col>
                            </Row>
                            <Row className='mt-30 fs-24 w-full justify-center items-center'>
                                <Button onClick={onSave} variant="primary" size="md">Save</Button>
                            </Row>
                        </div>
                        <div className='mt-30'>
                            <MaterialReactTable
                                style={{ background: '#142028' }}
                                displayColumnDefOptions={{
                                    'mrt-row-actions': {
                                        muiTableHeadCellProps: {
                                            align: 'center',
                                        },
                                        size: 120,
                                    },
                                }}
                                columns={columns}
                                data={tableData}
                                editingMode="modal" //default
                                enableColumnOrdering
                                enableEditing
                                onEditingRowSave={handleSaveRowEdits}
                                onEditingRowCancel={handleCancelRowEdits}
                                renderRowActions={({ row, table }) => (
                                    <Box sx={{ display: 'flex', gap: '1rem' }}>
                                        <Tooltip arrow placement="left" title="Edit">
                                            <IconButton onClick={() => {
                                                table.setEditingRow(row)
                                            }}>
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip arrow placement="right" title="Delete">
                                            <IconButton color="error" onClick={() => handleDeleteRow(row)}>
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                                renderTopToolbarCustomActions={() => (
                                    <Button
                                        color="primary"
                                        onClick={() => setCreateModalOpen(true)}
                                    // variant="contained"
                                    >
                                        Create New User
                                    </Button>
                                )}
                                size="lg"
                            />
                            <CreateNewAccountModal
                                columns={columns}
                                open={createModalOpen}
                                onClose={() => setCreateModalOpen(false)}
                                onSubmit={handleCreateNewRow}
                            />
                        </div>
                    </>
                ) : (
                    <Login onSignIn={onSignIn} />
                )}
            </div>

        </div >
    )
}

export const CreateNewAccountModal = ({ open, columns, onClose, onSubmit }) => {
    const [values, setValues] = useState(() =>
        columns.reduce((acc, column) => {
            acc[column.accessorKey ?? ''] = '';
            return acc;
        }, {}),
    );

    const handleSubmit = () => {
        //put your validation logic here
        onSubmit(values);
        onClose();
    };

    return (
        <Dialog open={open}>
            <DialogTitle textAlign="center">Create New User</DialogTitle>
            <DialogContent>
                <form onSubmit={(e) => e.preventDefault()}>
                    <Stack
                        sx={{
                            width: '100%',
                            minWidth: { xs: '300px', sm: '360px', md: '400px' },
                            gap: '1.5rem',
                        }}
                    >
                        {columns.map((column) => (
                            <TextField
                                key={column.accessorKey}
                                label={column.header}
                                name={column.accessorKey}
                                onChange={(e) =>
                                    setValues({ ...values, [e.target.name]: e.target.value })
                                }
                            />
                        ))}
                    </Stack>
                </form>
            </DialogContent>
            <DialogActions sx={{ p: '1.25rem' }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button color="secondary" onClick={handleSubmit} variant="contained">
                    Create New
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Admin;